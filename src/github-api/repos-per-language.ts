import request, {assertNoGraphQLErrors} from '../utils/request';
import {shouldFetchNextPage} from '../const/pagination';

export class RepoLanguageInfo {
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

export class RepoLanguages {
    private languageMap = new Map<string, RepoLanguageInfo>();

    public addLanguage(name: string, color: string | null): void {
        if (this.languageMap.has(name)) {
            const lang = this.languageMap.get(name)!;
            lang.count += 1;
            this.languageMap.set(name, lang);
        } else {
            this.languageMap.set(name, new RepoLanguageInfo(name, color, 1));
        }
    }

    public getLanguageMap(): Map<string, RepoLanguageInfo> {
        return this.languageMap;
    }
}

const fetcher = (token: string, variables: any) => {
    // contain private repo need token permission
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query ReposPerLanguage($login: String!, $endCursor: String) {
        user(login: $login) {
          repositories(isFork: false, first: 100, after: $endCursor, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
            nodes {
              primaryLanguage {
                name
                color
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
      `,
            variables
        }
    );
};

// repos per language
export async function getRepoLanguages(
    username: string,
    exclude: Array<string>,
    token: string
): Promise<RepoLanguages> {
    // Ordered by stars DESC; pagination is unbounded off Vercel and bounded to
    // VERCEL_MAX_REPO_PAGES on Vercel (see src/const/pagination.ts).
    const repoLanguages = new RepoLanguages();
    const nodes: {primaryLanguage: {name: string; color: string} | null}[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;
    let pages = 0;

    while (hasNextPage) {
        const res: any = await fetcher(token, {login: username, endCursor: cursor});
        assertNoGraphQLErrors(res, 'GetRepoLanguage fail');
        const repos = res.data.data.user.repositories;
        nodes.push(...repos.nodes);
        cursor = repos.pageInfo?.endCursor ?? null;
        pages += 1;
        hasNextPage = shouldFetchNextPage(!!repos.pageInfo?.hasNextPage, pages);
    }

    nodes.forEach((node: {primaryLanguage: {name: string; color: string} | null}) => {
        if (node.primaryLanguage) {
            const langName = node.primaryLanguage.name;
            const langColor = node.primaryLanguage.color;
            if (!exclude.includes(langName.toLowerCase())) {
                repoLanguages.addLanguage(langName, langColor);
            }
        }
    });

    return repoLanguages;
}
