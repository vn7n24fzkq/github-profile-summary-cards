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
      query ReposPerLanguage($login: String!) {
        user(login: $login) {
          repositories(isFork: false, first: 100, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
            nodes {
              primaryLanguage {
                name
                color
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

// repos per language
export async function getRepoLanguages(
    username: string,
    exclude: Array<string>,
    token: string
): Promise<RepoLanguages> {
    // Cap at the top 100 repos (by stars) in a single query instead of paginating
    // through every repo: unbounded pagination let large accounts blow past the
    // Vercel function timeout and burn the shared GitHub rate limit for everyone.
    const repoLanguages = new RepoLanguages();

    const res: any = await fetcher(token, {login: username});
    if (res.data.errors) {
        throw Error(res.data.errors[0].message || 'GetRepoLanguage fail');
    }
    const nodes = res.data.data.user.repositories.nodes;

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
