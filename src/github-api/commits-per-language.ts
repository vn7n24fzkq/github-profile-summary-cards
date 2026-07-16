import request, {assertNoGraphQLErrors} from '../utils/request';

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

// repos per language
export async function getCommitLanguage(
    username: string,
    exclude: Array<string>,
    token: string,
    excludeRepos: Array<string> = []
): Promise<CommitLanguages> {
    const commitLanguages = new CommitLanguages();

    const res = await fetcher(token, {
        login: username
    });

    assertNoGraphQLErrors(res, 'GetCommitLanguage failed');

    res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
        (node: {
            repository: {name: string; nameWithOwner: string; primaryLanguage: {name: string; color: string} | null};
            contributions: {totalCount: number};
        }) => {
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
        }
    );

    return commitLanguages;
}
