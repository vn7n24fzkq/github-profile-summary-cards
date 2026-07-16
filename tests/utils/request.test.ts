import request, {assertNoGraphQLErrors} from '../../src/utils/request';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('assertNoGraphQLErrors', () => {
    it('does nothing when there are no errors', () => {
        expect(() => assertNoGraphQLErrors({data: {data: {}}}, 'fallback')).not.toThrow();
        expect(() => assertNoGraphQLErrors({data: {errors: []}}, 'fallback')).not.toThrow();
    });

    it('throws the first error message', () => {
        expect(() => assertNoGraphQLErrors({data: {errors: [{message: 'boom'}]}}, 'fallback')).toThrow('boom');
    });

    it('uses the fallback message when the error has none', () => {
        expect(() => assertNoGraphQLErrors({data: {errors: [{}]}}, 'fallback')).toThrow('fallback');
    });

    it('flags RATE_LIMITED errors with isRateLimit so callers can rotate tokens', () => {
        expect.assertions(1);
        try {
            assertNoGraphQLErrors({data: {errors: [{type: 'RATE_LIMITED', message: 'limit'}]}}, 'fallback');
        } catch (e: any) {
            expect(e.isRateLimit).toBe(true);
        }
    });

    it('flags typeless "rate limit already exceeded" errors too (production outage 2026-07-17)', () => {
        expect.assertions(1);
        try {
            assertNoGraphQLErrors(
                {data: {errors: [{message: 'API rate limit already exceeded for user ID 305432014.'}]}},
                'fallback'
            );
        } catch (e: any) {
            expect(e.isRateLimit).toBe(true);
        }
    });

    it('does not flag non-rate-limit errors', () => {
        expect.assertions(1);
        try {
            assertNoGraphQLErrors({data: {errors: [{type: 'NOT_FOUND', message: 'nope'}]}}, 'fallback');
        } catch (e: any) {
            expect(e.isRateLimit).toBeUndefined();
        }
    });

    it('flags resource-limit errors with isResourceLimit so callers can split the query', () => {
        expect.assertions(2);
        try {
            assertNoGraphQLErrors(
                {data: {errors: [{message: 'Resource limits for this query exceeded.'}]}},
                'fallback'
            );
        } catch (e: any) {
            expect(e.isResourceLimit).toBe(true);
            expect(e.isRateLimit).toBeUndefined();
        }
    });
});

describe('GitHub concurrency gate', () => {
    it('caps concurrent GitHub calls at 8 and still completes every request', async () => {
        const mock = new MockAdapter(axios, {delayResponse: 30});
        let inFlight = 0;
        let peak = 0;
        mock.onPost('https://api.github.com/graphql').reply(() => {
            inFlight += 1;
            peak = Math.max(peak, inFlight);
            return new Promise(resolve =>
                setTimeout(() => {
                    inFlight -= 1;
                    resolve([200, {data: {ok: true}}]);
                }, 20)
            );
        });
        try {
            const results = await Promise.all(
                Array.from({length: 30}, () => request({Authorization: 'bearer t'}, {query: '{x}'}))
            );
            expect(results).toHaveLength(30);
            expect(peak).toBeLessThanOrEqual(8);
            expect(peak).toBeGreaterThan(1); // the gate parallelizes, not serializes
        } finally {
            mock.restore();
        }
    });

    it("hands a failed request's slot to queued waiters under saturation", async () => {
        const mock = new MockAdapter(axios);
        // 404 is not retried by retry-axios, so rejections are immediate. The
        // gate is saturated (8 slow calls), then extra calls QUEUE — two of
        // them fail once they run. If a failure ever dropped its slot instead
        // of handing it down, the remaining waiters would deadlock and this
        // test would time out.
        let served = 0;
        mock.onPost('https://api.github.com/graphql').reply(config => {
            served += 1;
            const body = JSON.parse(config.data);
            if (body.query.includes('FAIL')) return [404, {}];
            return new Promise(resolve => setTimeout(() => resolve([200, {data: {ok: true}}]), 15));
        });
        try {
            const calls = [
                ...Array.from({length: 8}, () => request({}, {query: '{slow}'})), // saturate every slot
                request({}, {query: '{FAIL_1}'}), // queued, then fails
                request({}, {query: '{FAIL_2}'}), // queued, then fails
                ...Array.from({length: 4}, () => request({}, {query: '{slow}'})) // queued behind the failures
            ];
            const settled = await Promise.allSettled(calls);
            expect(settled.filter(s => s.status === 'fulfilled')).toHaveLength(12);
            expect(settled.filter(s => s.status === 'rejected')).toHaveLength(2);
            expect(served).toBe(14); // every queued call actually ran — no lost slots
        } finally {
            mock.restore();
        }
    });
});
