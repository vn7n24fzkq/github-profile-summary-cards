import {assertNoGraphQLErrors} from '../../src/utils/request';

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
