import {shouldFetchNextPage, VERCEL_MAX_REPO_PAGES, VERCEL_PAGINATION_BUDGET_MS} from '../../src/const/pagination';

afterEach(() => {
    delete process.env.VERCEL;
});

describe('shouldFetchNextPage', () => {
    it('always continues off Vercel while pages remain', () => {
        delete process.env.VERCEL;
        expect(shouldFetchNextPage(true, 999)).toBe(true);
        expect(shouldFetchNextPage(false, 1)).toBe(false);
    });

    it('caps pages on Vercel', () => {
        process.env.VERCEL = '1';
        expect(shouldFetchNextPage(true, VERCEL_MAX_REPO_PAGES - 1)).toBe(true);
        expect(shouldFetchNextPage(true, VERCEL_MAX_REPO_PAGES)).toBe(false);
    });

    it('stops on Vercel when the time budget is spent, even with pages left', () => {
        process.env.VERCEL = '1';
        const exhausted = Date.now() - VERCEL_PAGINATION_BUDGET_MS - 1000;
        expect(shouldFetchNextPage(true, 1, undefined, exhausted)).toBe(false);
        // fresh budget → keeps going
        expect(shouldFetchNextPage(true, 1, undefined, Date.now())).toBe(true);
    });

    it('ignores the budget off Vercel', () => {
        delete process.env.VERCEL;
        const exhausted = Date.now() - VERCEL_PAGINATION_BUDGET_MS - 1000;
        expect(shouldFetchNextPage(true, 1, undefined, exhausted)).toBe(true);
    });
});
