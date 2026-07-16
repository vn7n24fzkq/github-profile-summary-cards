import {
    withDataCache,
    primeDataCache,
    runWithCacheStats,
    isKvHealthy,
    resetKvHealthForTests
} from '../../src/utils/data-cache';

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
        resetKvHealthForTests();
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
        const staleAt = Date.now() - 13 * 60 * 60 * 1000; // older than the 12h fresh window
        fetchSpy
            .mockResolvedValueOnce(envelopeResponse(staleAt, 'stale'))
            .mockResolvedValueOnce({ok: true, json: async () => ({})} as Response);
        const fetcher = jest.fn().mockResolvedValue('fresh');
        await expect(withDataCache('k', fetcher)).resolves.toBe('fresh');
    });

    it('serves the stale value when the fetcher fails (rate limited)', async () => {
        const staleAt = Date.now() - 13 * 60 * 60 * 1000;
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

describe('runWithCacheStats', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
        process.env.KV_REST_API_URL = KV_URL;
        process.env.KV_REST_API_TOKEN = 'kv-token';
        resetKvHealthForTests();
        fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
    });

    it('reports fresh when every lookup hit the cache', async () => {
        fetchSpy.mockResolvedValue(envelopeResponse(Date.now(), 'cached'));
        const {result, cacheStatus} = await runWithCacheStats(async () => {
            await withDataCache('a', jest.fn());
            await withDataCache('b', jest.fn());
            return 'svg';
        });
        expect(result).toBe('svg');
        expect(cacheStatus).toBe('fresh');
    });

    it('reports miss when data had to be fetched', async () => {
        fetchSpy.mockResolvedValue(missResponse);
        const {cacheStatus} = await runWithCacheStats(async () => {
            await withDataCache('a', jest.fn().mockResolvedValue('x'));
            return 'svg';
        });
        expect(cacheStatus).toBe('miss');
    });

    it('reports stale when a fallback copy was served', async () => {
        const staleAt = Date.now() - 13 * 60 * 60 * 1000;
        fetchSpy.mockResolvedValue(envelopeResponse(staleAt, 'stale'));
        const {cacheStatus} = await runWithCacheStats(async () => {
            await withDataCache('a', jest.fn().mockRejectedValue(new Error('rate limited')));
            return 'svg';
        });
        expect(cacheStatus).toBe('stale');
    });

    it('reports disabled when KV is not configured', async () => {
        delete process.env.KV_REST_API_URL;
        const {cacheStatus} = await runWithCacheStats(async () => 'svg');
        expect(cacheStatus).toBe('disabled');
    });
});

describe('retention and coalescing', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
        process.env.KV_REST_API_URL = KV_URL;
        process.env.KV_REST_API_TOKEN = 'kv-token';
        resetKvHealthForTests();
        fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
    });

    it('uses the retention seconds for the Redis EX', async () => {
        fetchSpy
            .mockResolvedValueOnce(missResponse)
            .mockResolvedValueOnce({ok: true, json: async () => ({})} as Response);
        await withDataCache('k', jest.fn().mockResolvedValue('x'), {freshSeconds: 60, retentionSeconds: 1234});
        expect(String(fetchSpy.mock.calls[1][0])).toContain('EX=1234');
    });

    it('defaults retention to 7 days and keeps the numeric third arg working', async () => {
        fetchSpy
            .mockResolvedValueOnce(missResponse)
            .mockResolvedValueOnce({ok: true, json: async () => ({})} as Response);
        await withDataCache('k', jest.fn().mockResolvedValue('x'), 60);
        expect(String(fetchSpy.mock.calls[1][0])).toContain(`EX=${7 * 24 * 60 * 60}`);
    });

    it('coalesces concurrent lookups of the same key into one fetch', async () => {
        let resolveKv: (v: Response) => void = () => undefined;
        fetchSpy
            .mockReturnValueOnce(new Promise<Response>(resolve => (resolveKv = resolve)))
            .mockResolvedValueOnce({ok: true, json: async () => ({})} as Response);
        const fetcher = jest.fn().mockResolvedValue('data');

        const p1 = withDataCache('same-key', fetcher);
        const p2 = withDataCache('same-key', fetcher);
        resolveKv(missResponse);
        await expect(Promise.all([p1, p2])).resolves.toEqual(['data', 'data']);
        expect(fetcher).toHaveBeenCalledTimes(1);

        // the in-flight entry is cleaned up: a later call fetches again
        fetchSpy
            .mockResolvedValueOnce(missResponse)
            .mockResolvedValueOnce({ok: true, json: async () => ({})} as Response);
        await withDataCache('same-key', fetcher);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('followers report a fresh cache outcome', async () => {
        let resolveKv: (v: Response) => void = () => undefined;
        fetchSpy
            .mockReturnValueOnce(new Promise<Response>(resolve => (resolveKv = resolve)))
            .mockResolvedValueOnce({ok: true, json: async () => ({})} as Response);
        const leader = withDataCache('co-key', jest.fn().mockResolvedValue('data'));
        const follower = runWithCacheStats(() => withDataCache('co-key', jest.fn()));
        resolveKv(missResponse);
        await leader;
        const {cacheStatus} = await follower;
        expect(cacheStatus).toBe('fresh');
    });
});

describe('circuit breaker', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
        process.env.KV_REST_API_URL = KV_URL;
        process.env.KV_REST_API_TOKEN = 'kv-token';
        resetKvHealthForTests();
        fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
    });

    it('opens after three consecutive KV failures and skips KV entirely', async () => {
        fetchSpy.mockRejectedValue(new Error('kv down'));
        for (const key of ['a', 'b', 'c']) {
            await withDataCache(key, jest.fn().mockResolvedValue('x'));
        }
        expect(isKvHealthy()).toBe(false);

        fetchSpy.mockClear();
        const fetcher = jest.fn().mockResolvedValue('direct');
        await expect(withDataCache('d', fetcher)).resolves.toBe('direct');
        expect(fetchSpy).not.toHaveBeenCalled(); // no KV I/O while open
    });

    it('does not count cache misses as failures', async () => {
        fetchSpy.mockResolvedValue(missResponse);
        for (const key of ['a', 'b', 'c', 'd']) {
            // eslint-disable-next-line no-await-in-loop
            await withDataCache(key, jest.fn().mockResolvedValue('x'));
        }
        expect(isKvHealthy()).toBe(true);
    });

    it('opens on a write-only outage (reads keep succeeding)', async () => {
        // GET succeeds with a miss, SET fails — a shared streak would never trip.
        fetchSpy.mockImplementation((url: RequestInfo | URL) =>
            String(url).includes('/set/') ? Promise.reject(new Error('write failed')) : Promise.resolve(missResponse)
        );
        for (const key of ['a', 'b', 'c']) {
            // eslint-disable-next-line no-await-in-loop
            await withDataCache(key, jest.fn().mockResolvedValue('x'));
        }
        expect(isKvHealthy()).toBe(false);
    });

    it('recovers after the cooldown', async () => {
        fetchSpy.mockRejectedValue(new Error('kv down'));
        for (const key of ['a', 'b', 'c']) {
            await withDataCache(key, jest.fn().mockResolvedValue('x'));
        }
        expect(isKvHealthy()).toBe(false);

        const nowSpy = jest.spyOn(Date, 'now');
        nowSpy.mockReturnValue(Date.now() + 61_000);
        try {
            expect(isKvHealthy()).toBe(true);
        } finally {
            nowSpy.mockRestore();
        }
    });
});

describe('primeDataCache (batched MGET)', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
        process.env.KV_REST_API_URL = KV_URL;
        process.env.KV_REST_API_TOKEN = 'kv-token';
        resetKvHealthForTests();
        fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
    });

    it('reads many keys with one MGET and serves primed hits without extra GETs', async () => {
        const now = Date.now();
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                result: [JSON.stringify({at: now, data: 'v1'}), JSON.stringify({at: now, data: 'v2'})]
            })
        } as Response);

        const primed = await primeDataCache(['k1', 'k2']);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(String(fetchSpy.mock.calls[0][0])).toContain('/mget/k1/k2');

        const fetcher = jest.fn();
        await expect(withDataCache('k1', fetcher, {primed})).resolves.toBe('v1');
        await expect(withDataCache('k2', fetcher, {primed})).resolves.toBe('v2');
        expect(fetcher).not.toHaveBeenCalled();
        expect(fetchSpy).toHaveBeenCalledTimes(1); // still just the MGET
    });

    it('treats null and corrupt MGET values as misses that re-fetch and store', async () => {
        fetchSpy
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({result: [null, 'not-json{']})
            } as Response)
            .mockResolvedValue({ok: true, json: async () => ({})} as Response); // SETs

        const primed = await primeDataCache(['k1', 'k2']);
        const fetcher = jest.fn().mockResolvedValue('fetched');
        await expect(withDataCache('k1', fetcher, {primed})).resolves.toBe('fetched');
        await expect(withDataCache('k2', fetcher, {primed})).resolves.toBe('fetched');
        expect(fetcher).toHaveBeenCalledTimes(2);
        // no per-key GET happened — only the MGET plus the two SETs
        const urls = fetchSpy.mock.calls.map(c => String(c[0]));
        expect(urls.filter(u => u.includes('/get/'))).toHaveLength(0);
        expect(urls.filter(u => u.includes('/set/'))).toHaveLength(2);
    });

    it('fails open on MGET errors (empty map, callers fall back per key) and feeds the breaker', async () => {
        fetchSpy.mockRejectedValue(new Error('kv down'));
        for (let i = 0; i < 3; i++) {
            // eslint-disable-next-line no-await-in-loop
            const primed = await primeDataCache(['a', 'b']);
            expect(primed.size).toBe(0);
        }
        expect(isKvHealthy()).toBe(false);
    });

    it('is a no-op without keys or KV configuration', async () => {
        await expect(primeDataCache([])).resolves.toEqual(new Map());
        delete process.env.KV_REST_API_URL;
        await expect(primeDataCache(['a'])).resolves.toEqual(new Map());
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
