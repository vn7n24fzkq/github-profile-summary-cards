// Full-history contribution totals.
//
// GitHub's contributionsCollection answers at most one year per query, but
// past years never change — each (user, year) is cached long-term inside
// getContributionByYear and only the current year refreshes. The semantics do
// NOT depend on cache health: Redis is a quota buffer, never a data switch.
// With a cold or dead cache the same totals are computed straight from GitHub
// (per-year queries are light; a 15-year account is ~3 parallel rounds).
//
// Caveat: contribution counts are viewer-dependent (private contributions are
// only visible to the account itself). The service always queries with its own
// tokens, so cached values are consistently the public view; don't warm the
// shared cache with a personal token — it writes the private-inclusive view.

import {getContributionByYear, contributionYearCacheKey} from '../github-api/contributions-by-year';
import {primeDataCache, requestStartedAt} from './data-cache';
import {VERCEL_PAGINATION_BUDGET_MS} from '../const/pagination';

// Parallel chunk size for per-year queries: keeps a 15-year account to ~3
// rounds while staying friendly to GitHub's secondary rate limits.
const YEAR_CHUNK_SIZE = 5;

export interface ContributionTotals {
    totalCommitContributions: number;
    totalContributions: number;
}

/**
 * Sums commit/total contributions across every contribution year.
 *
 * Years are fetched newest-first in parallel chunks. On Vercel, exceeding the
 * pagination time budget throws (rather than mislabelling a partial sum as a
 * total — the card renders an error instead); the years fetched so far are
 * already cached, so the next render completes. Off Vercel (Action/CLI) there
 * is no budget and errors propagate as before.
 *
 * @param {string} username - The GitHub login.
 * @param {Array<number>} contributionYears - Years from the profile data.
 * @param {string} token - GitHub token.
 * @return {Promise<ContributionTotals>} Full-history totals.
 */
export async function getContributionTotals(
    username: string,
    contributionYears: number[],
    token: string
): Promise<ContributionTotals> {
    const years = [...contributionYears].sort((a, b) => b - a);
    // The budget measures from the request start when available so phases and
    // rotation retries can't stack separate clocks past the function limit.
    const startedAt = requestStartedAt() ?? Date.now();

    // One MGET for every year key (one billed command) instead of a GET per
    // year — on a warm cache the whole history costs a single Redis command.
    const primed = await primeDataCache(years.map(year => contributionYearCacheKey(username, year)));

    let totalCommitContributions = 0;
    let totalContributions = 0;

    for (let i = 0; i < years.length; i += YEAR_CHUNK_SIZE) {
        if (process.env.VERCEL && Date.now() - startedAt > VERCEL_PAGINATION_BUDGET_MS) {
            // Fetched years are cached already — the next render finishes fast.
            throw new Error(`Contribution history for ${username} timed out before all years were fetched`);
        }
        const chunk = years.slice(i, i + YEAR_CHUNK_SIZE);
        const results = await Promise.all(chunk.map(year => getContributionByYear(username, year, token, primed)));
        for (const result of results) {
            totalCommitContributions += result.totalCommitContributions;
            totalContributions += result.totalContributions;
        }
    }

    return {totalCommitContributions, totalContributions};
}
