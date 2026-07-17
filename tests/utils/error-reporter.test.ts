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
