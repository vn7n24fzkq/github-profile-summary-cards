describe('Analytics Utils', () => {
    const ORIGINAL_ENV = process.env;
    const ORIGINAL_FETCH = global.fetch;

    beforeEach(() => {
        jest.resetModules();
        process.env = {...ORIGINAL_ENV};
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                text: () => Promise.resolve('ok')
            })
        ) as any;
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
        global.fetch = ORIGINAL_FETCH;
    });

    it('should not send analytics if env vars are missing', async () => {
        delete process.env.GA_MEASUREMENT_ID;
        delete process.env.GA_API_SECRET;

        // Dynamic import to pick up env changes if needed, though simple import works if env is checked at runtime
        const {sendAnalytics} = require('../../src/utils/analytics');

        await sendAnalytics('test_event');

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not send analytics if not on Vercel', async () => {
        process.env.GA_MEASUREMENT_ID = 'G-TEST';
        process.env.GA_API_SECRET = 'SECRET';
        delete process.env.VERCEL;

        const {sendAnalytics} = require('../../src/utils/analytics');

        await sendAnalytics('test_event');

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should send correct payload to GA4 when enabled and on Vercel', async () => {
        process.env.GA_MEASUREMENT_ID = 'G-TEST';
        process.env.GA_API_SECRET = 'SECRET';
        process.env.VERCEL = '1';

        const {sendAnalytics} = require('../../src/utils/analytics');

        const username = 'testuser';
        // Mock headers
        const headers = {
            'x-forwarded-for': '127.0.0.1, 10.0.0.1',
            'user-agent': 'Mozilla/5.0 Test'
        };

        await sendAnalytics('test_event', {username, foo: 'bar'}, headers);

        expect(global.fetch).toHaveBeenCalledTimes(1);

        const [url, options] = (global.fetch as jest.Mock).mock.calls[0];

        expect(url).toContain('measurement_id=G-TEST');
        expect(options.method).toBe('POST');

        const body = JSON.parse(options.body as string);

        expect(body.client_id).toEqual(expect.any(String)); // Valid hash
        expect(body.user_agent).toBe('Mozilla/5.0 Test');
        expect(body.ip_override).toBe('127.0.0.1');

        const event = body.events[0];
        expect(event.name).toBe('test_event');
        expect(event.params.username).toBeUndefined(); // PII Removed
        expect(event.params.foo).toBe('bar');
        expect(event.params.session_id).toBeTruthy();
        expect(event.params.engagement_time_msec).toBe(100);
    });

    it('should handle fetch errors gracefully', async () => {
        process.env.GA_MEASUREMENT_ID = 'G-TEST';
        process.env.GA_API_SECRET = 'SECRET';
        process.env.VERCEL = '1';

        const {sendAnalytics} = require('../../src/utils/analytics');

        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await sendAnalytics('test_event');

        expect(global.fetch).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Analytics error'), 'Network Error');

        consoleSpy.mockRestore();
    });
});
