// Repo pagination policy. Off Vercel (Action / CLI — the user's own token, no
// duration limit) pagination is unbounded. On Vercel we used to stop at the
// first 100 repos, which made star counts and language stats visibly wrong for
// accounts with more repos (#164, #207, #182); instead, allow a bounded number
// of pages: 10 pages = 1,000 repos covers practically every account while
// keeping worst-case latency and GraphQL quota cost per render bounded.
export const VERCEL_MAX_REPO_PAGES = 10;

/**
 * Decides whether another repository page should be fetched.
 *
 * @param {boolean} hasNextPage - Whether the API reports more pages.
 * @param {number} pagesFetched - How many pages have been fetched so far.
 * @return {boolean} True when the caller should fetch the next page.
 */
export function shouldFetchNextPage(hasNextPage: boolean, pagesFetched: number): boolean {
    if (!hasNextPage) return false;
    if (!process.env.VERCEL) return true;
    return pagesFetched < VERCEL_MAX_REPO_PAGES;
}
