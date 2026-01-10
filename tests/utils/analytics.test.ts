jest.mock('axios');

describe('Analytics Utils', () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        jest.resetModules(); // This resets the module registry, creating new mock instances
        process.env = {...ORIGINAL_ENV};
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });

    it('should not send analytics if env vars are missing', async () => {
        delete process.env.GA_MEASUREMENT_ID;
        delete process.env.GA_API_SECRET;
        const {sendAnalytics} = require('../../src/utils/analytics');
        const axiosMock = require('axios'); // Get the current mock instance

        await sendAnalytics('test_event');

        expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('should not send analytics if not on Vercel', async () => {
        process.env.GA_MEASUREMENT_ID = 'G-TEST';
        process.env.GA_API_SECRET = 'SECRET';
        delete process.env.VERCEL;
        const {sendAnalytics} = require('../../src/utils/analytics');
        const axiosMock = require('axios');

        await sendAnalytics('test_event');

        expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('should send correct payload to GA4 when enabled and on Vercel', async () => {
        process.env.GA_MEASUREMENT_ID = 'G-TEST';
        process.env.GA_API_SECRET = 'SECRET';
        process.env.VERCEL = '1';
        const {sendAnalytics} = require('../../src/utils/analytics');
        const axiosMock = require('axios');

        const username = 'testuser';
        await sendAnalytics('test_event', {username, foo: 'bar'});

        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith(
            expect.stringContaining('measurement_id=G-TEST'),
            expect.objectContaining({
                client_id: expect.any(String), // Should be a hash now
                events: expect.arrayContaining([
                    expect.objectContaining({
                        name: 'test_event',
                        params: expect.objectContaining({
                            username: 'testuser',
                            foo: 'bar',
                            session_id: '1'
                        })
                    })
                ])
            }),
            expect.any(Object)
        );
    });

    it('should handle axios errors gracefully', async () => {
        process.env.GA_MEASUREMENT_ID = 'G-TEST';
        process.env.GA_API_SECRET = 'SECRET';
        process.env.VERCEL = '1';
        const {sendAnalytics} = require('../../src/utils/analytics');
        const axiosMock = require('axios');

        axiosMock.post.mockRejectedValue(new Error('Network Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await sendAnalytics('test_event');

        expect(axiosMock.post).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Analytics error'), 'Network Error');

        consoleSpy.mockRestore();
    });
});
