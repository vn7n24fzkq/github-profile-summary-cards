import {reportUnexpectedError} from '../../api/utils/error-reporter';
import * as Sentry from '@sentry/node';

jest.mock('@sentry/node', () => ({
    init: jest.fn(),
    withScope: jest.fn((fn: (scope: any) => void) => fn({setTags: jest.fn(), setUser: jest.fn()})),
    captureException: jest.fn(),
    flush: jest.fn().mockResolvedValue(true)
}));

describe('reportUnexpectedError', () => {
    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.SENTRY_DSN;
    });

    it('is a no-op without SENTRY_DSN', async () => {
        await reportUnexpectedError(new Error('mystery boom'), 'stats_card', 'u', 'unavailable');
        expect(Sentry.init).not.toHaveBeenCalled();
        expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('skips every known failure class even with a DSN', async () => {
        process.env.SENTRY_DSN = 'https://x@sentry.example/1';
        const known = [
            'API rate limit already exceeded for user ID 1.',
            'You have exceeded a secondary rate limit.',
            'Resource limits for this query exceeded.',
            'Contribution history for x timed out before all years were fetched',
            'No more GITHUB_TOKEN can be used (Index: 2)',
            "Could not resolve to a User with the login of 'nope'.",
            'user not found'
        ];
        for (const msg of known) {
            await reportUnexpectedError(new Error(msg), 'stats_card', 'u', 'unavailable');
        }
        expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('captures genuinely unexpected errors with card/user tags', async () => {
        process.env.SENTRY_DSN = 'https://x@sentry.example/1';
        await reportUnexpectedError(
            new Error("Cannot read properties of undefined (reading 'weeks')"),
            'profile_details_card',
            'someuser',
            'unavailable'
        );
        expect(Sentry.init).toHaveBeenCalledTimes(1);
        expect(Sentry.captureException).toHaveBeenCalledTimes(1);
        expect(Sentry.flush).toHaveBeenCalled();
    });

    it('never throws when Sentry itself fails', async () => {
        process.env.SENTRY_DSN = 'https://x@sentry.example/1';
        (Sentry.captureException as jest.Mock).mockImplementationOnce(() => {
            throw new Error('sentry down');
        });
        await expect(
            reportUnexpectedError(new Error('weird'), 'stats_card', 'u', 'unavailable')
        ).resolves.toBeUndefined();
    });
});

describe('shipErrorRecord (Axiom ingest)', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ok: true, json: async () => ({})} as Response);
    });

    afterEach(() => {
        fetchSpy.mockRestore();
        delete process.env.AXIOM_TOKEN;
        delete process.env.AXIOM_DATASET;
    });

    it('is a no-op without AXIOM_TOKEN/AXIOM_DATASET', async () => {
        const {shipErrorRecord} = require('../../api/utils/error-reporter');
        await shipErrorRecord(new Error('boom'), 'stats_card', 'u', 'rate_limited');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('ships a structured record for EVERY error class (unlike Sentry)', async () => {
        process.env.AXIOM_TOKEN = 'xaat-test';
        process.env.AXIOM_DATASET = 'card-errors';
        const {shipErrorRecord} = require('../../api/utils/error-reporter');
        await shipErrorRecord(
            new Error('API rate limit already exceeded for user ID 1.'),
            'stats_card',
            'torvalds',
            'rate_limited'
        );
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const [url, init] = fetchSpy.mock.calls[0];
        expect(String(url)).toBe('https://api.axiom.co/v1/datasets/card-errors/ingest');
        const record = JSON.parse(init.body)[0];
        expect(record.card).toBe('stats_card');
        expect(record.username).toBe('torvalds');
        expect(record.error_type).toBe('rate_limited');
        expect(record.message).toContain('rate limit');
        expect(record._time).toBeTruthy();
    });

    it('swallows ingest failures', async () => {
        process.env.AXIOM_TOKEN = 'xaat-test';
        process.env.AXIOM_DATASET = 'card-errors';
        fetchSpy.mockRejectedValueOnce(new Error('axiom down'));
        const {shipErrorRecord} = require('../../api/utils/error-reporter');
        await expect(shipErrorRecord(new Error('x'), 'stats_card', 'u', 'other')).resolves.toBeUndefined();
    });
});
