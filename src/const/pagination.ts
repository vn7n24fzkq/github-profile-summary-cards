// Repo pagination policy. Off Vercel (Action / CLI — the user's own token, no
// duration limit) pagination is unbounded. On Vercel we used to stop at the
// first 100 repos, which made star counts and language stats visibly wrong for
// accounts with more repos (#164, #207, #182); instead, allow a bounded number
// of pages: 10 pages = 1,000 repos covers practically every account while
// keeping worst-case latency and GraphQL quota cost per render bounded.
export const VERCEL_MAX_REPO_PAGES = 10;

// The organization-details query is far heavier per page (GitHub computes an
// open-issue count for every repo on the page), so big orgs blow the function
// time limit at 10 pages — the `github` org 504'd even at maxDuration 30s.
// 3 pages ≈ top 300 repos by stars renders in a few seconds.
export const VERCEL_MAX_ORG_DETAIL_PAGES = 3;

/**
 * Decides whether another repository page should be fetched.
 *
 * @param {boolean} hasNextPage - Whether the API reports more pages.
 * @param {number} pagesFetched - How many pages have been fetched so far.
 * @param {number} [maxPages] - Vercel page budget for this query type.
 * @return {boolean} True when the caller should fetch the next page.
 */
export function shouldFetchNextPage(
    hasNextPage: boolean,
    pagesFetched: number,
    maxPages: number = VERCEL_MAX_REPO_PAGES
): boolean {
    if (!hasNextPage) return false;
    if (!process.env.VERCEL) return true;
    return pagesFetched < maxPages;
}
