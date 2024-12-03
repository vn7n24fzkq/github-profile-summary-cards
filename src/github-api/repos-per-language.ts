import request from '../utils/request';

export class RepoLanguageInfo {
    name: string;
    color: string; // hexadecimal color code
    count: number;

    constructor(name: string, color: string = '#586e75', count: number) {
        this.name = name;
        this.color = color;
        this.count = count;
    }
}

export class RepoLanguages {
    private languageMap = new Map<string, RepoLanguageInfo>();

    public addLanguage(name: string, color: string): void {
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
      query ReposPerLanguage($login: String!,$endCursor: String) {
        user(login: $login) {
          repositories(isFork: false, first: 100, after: $endCursor,ownerAffiliations: OWNER) {
            nodes {
              primaryLanguage {
                name
                color
              }
            }
            pageInfo{
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
export async function getRepoLanguages(username: string, exclude: Array<string>): Promise<RepoLanguages> {
    let hasNextPage = true;
    let cursor = null;
    const repoLanguages = new RepoLanguages();
    const nodes = [];

    while (hasNextPage) {
        const res: any = await fetcher(process.env.GITHUB_TOKEN!, {
            login: username,
            endCursor: cursor
        });

        if (res.data.errors) {
            throw Error(res.data.errors[0].message || 'GetRepoLanguage fail');
        }
        cursor = res.data.data.user.repositories.pageInfo.endCursor;
        hasNextPage = res.data.data.user.repositories.pageInfo.hasNextPage;
        nodes.push(...res.data.data.user.repositories.nodes);
    }

    nodes.forEach(node => {
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
