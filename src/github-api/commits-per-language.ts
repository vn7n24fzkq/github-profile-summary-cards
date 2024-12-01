import request from '../utils/request';

export class CommitLanguageInfo {
    name: string;
    color: string; // hexadecimal color code
    count: number;

    constructor(name: string, color: string = '#586e75', count: number) {
        this.name = name;
        this.color = color;
        this.count = count;
    }
}

export class CommitLanguages {
    private languageMap = new Map<string, CommitLanguageInfo>();

    public addLanguageCount(name: string, color: string, count: number): void {
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

const fetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query CommitLanguages($login: String!) {
        user(login: $login) {
          contributionsCollection {
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
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

// repos per language
export async function getCommitLanguage(username: string, exclude: Array<string>): Promise<CommitLanguages> {
    const commitLanguages = new CommitLanguages();

    const res = await fetcher(process.env.GITHUB_TOKEN!, {
        login: username
    });

    if (res.data.errors) {
        throw Error(res.data.errors[0].message || 'GetCommitLanguage failed');
    }

    res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
        (node: {
            repository: {primaryLanguage: {name: string; color: string} | null};
            contributions: {totalCount: number};
        }) => {
            if (node.repository.primaryLanguage == null) {
                return;
            }
            const langName = node.repository.primaryLanguage.name;
            const langColor = node.repository.primaryLanguage.color;
            const totalCount = node.contributions.totalCount;
            if (!exclude.includes(langName.toLowerCase())) {
                commitLanguages.addLanguageCount(langName, langColor, totalCount);
            }
        }
    );

    return commitLanguages;
}
