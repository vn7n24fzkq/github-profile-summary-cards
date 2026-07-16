import {withDataCache} from '../../src/utils/data-cache';

const KV_URL = 'https://fake-kv.upstash.io';

function envelopeResponse(at: number, data: unknown) {
    return {
        ok: true,
        json: async () => ({result: JSON.stringify({at, data})})
    } as Response;
}

const missResponse = {
    ok: true,
    json: async () => ({result: null})
} as Response;

describe('withDataCache', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
        process.env.KV_REST_API_URL = KV_URL;
        process.env.KV_REST_API_TOKEN = 'kv-token';
        fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
    });

    it('fails open when KV is not configured', async () => {
        delete process.env.KV_REST_API_URL;
        const fetcher = jest.fn().mockResolvedValue('fresh');
        await expect(withDataCache('k', fetcher)).resolves.toBe('fresh');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns the cached value without fetching when fresh', async () => {
        fetchSpy.mockResolvedValueOnce(envelopeResponse(Date.now(), 'cached'));
        const fetcher = jest.fn();
        await expect(withDataCache('k', fetcher)).resolves.toBe('cached');
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('fetches and stores on a cache miss', async () => {
        fetchSpy
            .mockResolvedValueOnce(missResponse)
            .mockResolvedValueOnce({ok: true, json: async () => ({})} as Response);
        const fetcher = jest.fn().mockResolvedValue({value: 42});
        await expect(withDataCache('k', fetcher)).resolves.toEqual({value: 42});
        expect(fetcher).toHaveBeenCalledTimes(1);
        // second fetch call is the SET
        expect(fetchSpy.mock.calls[1][0]).toContain('/set/');
    });

    it('re-fetches when the cached value is stale', async () => {
        const staleAt = Date.now() - 7 * 60 * 60 * 1000; // older than the 6h fresh window
        fetchSpy
            .mockResolvedValueOnce(envelopeResponse(staleAt, 'stale'))
            .mockResolvedValueOnce({ok: true, json: async () => ({})} as Response);
        const fetcher = jest.fn().mockResolvedValue('fresh');
        await expect(withDataCache('k', fetcher)).resolves.toBe('fresh');
    });

    it('serves the stale value when the fetcher fails (rate limited)', async () => {
        const staleAt = Date.now() - 7 * 60 * 60 * 1000;
        fetchSpy.mockResolvedValueOnce(envelopeResponse(staleAt, 'stale'));
        const fetcher = jest.fn().mockRejectedValue(new Error('rate limited'));
        await expect(withDataCache('k', fetcher)).resolves.toBe('stale');
    });

    it('rethrows the fetcher error when there is no cached copy', async () => {
        fetchSpy.mockResolvedValueOnce(missResponse);
        const fetcher = jest.fn().mockRejectedValue(new Error('boom'));
        await expect(withDataCache('k', fetcher)).rejects.toThrow('boom');
    });

    it('fails open when the KV read itself blows up', async () => {
        fetchSpy.mockRejectedValueOnce(new Error('kv down')).mockRejectedValueOnce(new Error('kv down'));
        const fetcher = jest.fn().mockResolvedValue('fresh');
        await expect(withDataCache('k', fetcher)).resolves.toBe('fresh');
    });

    it('respects a custom fresh window', async () => {
        const at = Date.now() - 60 * 1000; // 1 minute old
        fetchSpy
            .mockResolvedValueOnce(envelopeResponse(at, 'cached'))
            .mockResolvedValueOnce({ok: true, json: async () => ({})} as Response);
        const fetcher = jest.fn().mockResolvedValue('fresh');
        // 30s fresh window → the 1-minute-old entry counts as stale
        await expect(withDataCache('k', fetcher, 30)).resolves.toBe('fresh');
        expect(fetcher).toHaveBeenCalledTimes(1);
    });
});
