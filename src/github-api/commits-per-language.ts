import request, {assertNoGraphQLErrors, GraphQLError} from '../utils/request';
import {withDataCache, primeDataCache, jitteredSeconds, requestStartedAt, PrimedReads} from '../utils/data-cache';

const DAY = 24 * 60 * 60;
import {VERCEL_PAGINATION_BUDGET_MS} from '../const/pagination';

export class CommitLanguageInfo {
    name: string;
    color: string; // hexadecimal color code
    count: number;

    constructor(name: string, color: string | null = '#586e75', count: number) {
        this.name = name;
        // GitHub returns null (not just undefined) for some languages' color.
        this.color = color || '#586e75';
        this.count = count;
    }
}

export class CommitLanguages {
    private languageMap = new Map<string, CommitLanguageInfo>();

    public addLanguageCount(name: string, color: string | null, count: number): void {
        if (this.languageMap.has(name)) {
            const lang = this.languageMap.get(name)!;
            lang.count += count;
            this.languageMap.set(name, lang);
        } else {
            this.languageMap.set(name, new CommitLanguageInfo(name, color, count));
        }
    }

    public getLanguageMap(): Map<string, CommitLanguageInfo> {
        return this.languageMap;
    }
}

interface CommitContributionNode {
    repository: {name: string; nameWithOwner: string; primaryLanguage: {name: string; color: string} | null};
    contributions: {totalCount: number};
}

// Parallel chunk size for per-year queries — matches contribution-history.
const YEAR_CHUNK_SIZE = 5;

const yearsFetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query ContributionYears($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionYears
          }
        }
      }
      `,
            variables
        }
    );
};

/**
 * Fetches the list of years the user has contributions in. A dedicated tiny
 * query (cached) so callers don't have to drag the heavy profile-details
 * query (star pagination and all) into their path.
 *
 * @param {string} username - The GitHub login.
 * @param {string} token - GitHub token.
 * @return {Promise<Array<number>>} Contribution years, e.g. [2026, 2025, ...].
 */
export async function getContributionYears(username: string, token: string): Promise<number[]> {
    return withDataCache(`v1:cys:${username.toLowerCase()}`, async () => {
        const res = await yearsFetcher(token, {login: username});
        assertNoGraphQLErrors(res, 'GetContributionYears failed');
        return res.data.data.user.contributionsCollection.contributionYears as number[];
    });
}

const fetcher = (token: string, variables: any) => {
    // The $from/$to window selects one calendar year (GitHub allows at most a
    // 1-year contributionsCollection range).
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query CommitLanguages($login: String!, $from: DateTime, $to: DateTime) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                name
                nameWithOwner
                primaryLanguage {
                  name
                  color
                }
              }
              contributions {
                  totalCount
              }
            }
          }
        }
      }
      `,
            variables
        }
    );
};

function commitLanguageYearCacheKey(username: string, year: number): string {
    // v2: compact tuple payload (see compressNodes) — cly keys are the biggest
    // Redis storage consumer and crossing the free plan's 256MB rejects ALL
    // writes (observed 2026-07-17).
    return `v2:cly:${username.toLowerCase()}:${year}`;
}

// Compact cache payload: [nameWithOwner, langName|null, langColor|null, count]
// per repo. The repo name is derived from nameWithOwner, and the verbose
// object shape is rebuilt after the cache boundary — ~60% smaller on the wire.
type CompactCommitNode = [string, string | null, string | null, number];

function compressNodes(nodes: CommitContributionNode[]): CompactCommitNode[] {
    return nodes.map(node => [
        node.repository.nameWithOwner ?? node.repository.name ?? '',
        node.repository.primaryLanguage?.name ?? null,
        node.repository.primaryLanguage?.color ?? null,
        node.contributions.totalCount
    ]);
}

function expandNodes(compact: CompactCommitNode[]): CommitContributionNode[] {
    return compact.map(([nameWithOwner, langName, langColor, count]) => ({
        repository: {
            name: nameWithOwner.split('/').pop() ?? nameWithOwner,
            nameWithOwner,
            primaryLanguage: langName === null ? null : ({name: langName, color: langColor} as any)
        },
        contributions: {totalCount: count}
    }));
}

async function fetchCommitContributionsWindow(
    username: string,
    token: string,
    from: string,
    to: string
): Promise<CommitContributionNode[]> {
    const res = await fetcher(token, {login: username, from, to});
    assertNoGraphQLErrors(res, 'GetCommitLanguage failed');
    return res.data.data.user.contributionsCollection.commitContributionsByRepository;
}

async function getCommitContributionsForYear(
    username: string,
    year: number,
    token: string,
    primed?: PrimedReads
): Promise<CommitContributionNode[]> {
    const isPastYear = year < new Date().getFullYear();
    // Jittered per key (90d ± 15d) so burst-cached keys don't expire together.
    const key = commitLanguageYearCacheKey(username, year);
    const freshSeconds = jitteredSeconds(key, 90 * DAY, 15 * DAY);
    const compact = await withDataCache(
        key,
        async () => {
            try {
                return compressNodes(
                    await fetchCommitContributionsWindow(
                        username,
                        token,
                        `${year}-01-01T00:00:00Z`,
                        `${year}-12-31T23:59:59Z`
                    )
                );
            } catch (err) {
                if (!(err as GraphQLError).isResourceLimit) throw err;
                // GitHub's cost estimator rejects mega-contribution user-years
                // outright ("Resource limits for this query exceeded") at ANY
                // maxRepositories — but a smaller time window scores lower, and
                // two half-year windows pass (verified on gaearon 2017: 10k+
                // commits). Same repos; a repo active in both halves appears
                // twice and its counts sum correctly during aggregation. Halves
                // that hit the 100-repo cap even cover MORE repos than a capped
                // full year would.
                const [h1, h2] = await Promise.all([
                    fetchCommitContributionsWindow(
                        username,
                        token,
                        `${year}-01-01T00:00:00Z`,
                        `${year}-06-30T23:59:59Z`
                    ),
                    fetchCommitContributionsWindow(
                        username,
                        token,
                        `${year}-07-01T00:00:00Z`,
                        `${year}-12-31T23:59:59Z`
                    )
                ]);
                return compressNodes([...h1, ...h2]);
            }
        },
        // Past years are immutable — cache long; the current year refreshes.
        isPastYear ? {freshSeconds, retentionSeconds: freshSeconds + 10 * DAY, primed} : {primed}
    );
    return expandNodes(compact);
}

/**
 * Full-history commit-language distribution: per-year queries merged across
 * every contribution year. Raw per-year data is cached (past years long-term);
 * language/repo exclusion filters apply after the cache boundary so they don't
 * fragment keys. Semantics are identical with or without a working cache —
 * Redis only buffers the GitHub quota. On Vercel, blowing the time budget
 * throws (error card) rather than returning a partial distribution; already
 * fetched years are cached so the next render completes.
 *
 * @param {string} username - The GitHub login.
 * @param {Array<string>} exclude - Lowercased language names to skip.
 * @param {string} token - GitHub token.
 * @param {Array<string>} excludeRepos - Lowercased repo / owner-repo names to skip.
 * @param {Array<number>} years - Contribution years (see getContributionYears).
 * @return {Promise<CommitLanguages>} Aggregated language → commit counts.
 */
export async function getCommitLanguageAllYears(
    username: string,
    exclude: Array<string>,
    token: string,
    excludeRepos: Array<string> = [],
    years: number[]
): Promise<CommitLanguages> {
    const commitLanguages = new CommitLanguages();
    const sortedYears = [...years].sort((a, b) => b - a);
    // Request-scoped clock — see contribution-history.
    const startedAt = requestStartedAt() ?? Date.now();

    // Batch-read every year key with one MGET; a warm render costs a single
    // Redis command instead of one per year.
    const primed = await primeDataCache(sortedYears.map(year => commitLanguageYearCacheKey(username, year)));

    for (let i = 0; i < sortedYears.length; i += YEAR_CHUNK_SIZE) {
        if (process.env.VERCEL && Date.now() - startedAt > VERCEL_PAGINATION_BUDGET_MS) {
            throw new Error(`Commit-language history for ${username} timed out before all years were fetched`);
        }
        const chunk = sortedYears.slice(i, i + YEAR_CHUNK_SIZE);
        const yearlyNodes = await Promise.all(
            chunk.map(year => getCommitContributionsForYear(username, year, token, primed))
        );
        for (const nodes of yearlyNodes) {
            aggregate(nodes, exclude, excludeRepos, commitLanguages);
        }
    }

    return commitLanguages;
}

function aggregate(
    nodes: CommitContributionNode[],
    exclude: Array<string>,
    excludeRepos: Array<string>,
    commitLanguages: CommitLanguages
): void {
    nodes.forEach(node => {
        // Commit contributions can live in other owners' repos, so match the
        // exclusion list against both `repo` and `owner/repo` forms.
        if (
            excludeRepos.includes((node.repository.name ?? '').toLowerCase()) ||
            excludeRepos.includes((node.repository.nameWithOwner ?? '').toLowerCase())
        ) {
            return;
        }
        if (node.repository.primaryLanguage == null) {
            return;
        }
        const langName = node.repository.primaryLanguage.name;
        const langColor = node.repository.primaryLanguage.color;
        const totalCount = node.contributions.totalCount;
        if (!exclude.includes(langName.toLowerCase())) {
            commitLanguages.addLanguageCount(langName, langColor, totalCount);
        }
    });
}
