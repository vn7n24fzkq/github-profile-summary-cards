import request, {assertNoGraphQLErrors} from '../utils/request';
import {withDataCache} from '../utils/data-cache';

export class ProfuctiveTime {
    productiveDate: Date[] = [];

    public addProductiveDate(date: Date) {
        this.productiveDate.push(date);
    }
}

const userIdFetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query getUserId($login: String!) {
        user(login: $login) {
            id
        }
      }
     `,
            variables
        }
    );
};

// We use the authored datetime to calculate productive time: committedDate is
// rewritten by squash/rebase merges (it becomes the merge-click time), while
// authoredDate keeps the moment the code was actually written.
//
// The contributionsCollection window is pinned to the same since/until range
// as the history sampling. Two reasons: the repo list should be "repos with
// commits in the sampled window" (the default trailing-year window listed
// repos with no commits in the window at all), and the trailing-year
// collection is what GitHub's cost estimator rejects for very active accounts
// ("Resource limits for this query exceeded") — the short window passes.
const fetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query ProductiveTime($login: String!,$userId: ID!,$until: GitTimestamp!,$since: GitTimestamp!,$from: DateTime!,$to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to){
            commitContributionsByRepository(maxRepositories:50) {
              repository {
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 50,since: $since,until: $until,author:{id:$userId}) {
                        edges {
                          node {
                            message
                            author{
                              email
                            }
                            authoredDate
                          }
                        }
                      }
                    }
                  }
                }
                name
                nameWithOwner
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

// get productive time
export async function getProductiveTime(
    username: string,
    until: string,
    since: string,
    token: string,
    excludeRepos: Array<string> = []
): Promise<ProfuctiveTime> {
    // The since/until window shifts with the current date, so it's part of the
    // key — plain commit-date strings are cached, Date-like usage stays outside.
    // v4: dates are cached grouped per repository so one shared cache entry can
    // serve any exclude_repos combination (the filter runs after the cache).
    const repoGroups = await withDataCache(`v4:pt:${username.toLowerCase()}:${since}:${until}`, async () => {
        const userIdResponse = await userIdFetcher(token, {
            login: username
        });

        if (userIdResponse.data.errors) {
            throw Error(userIdResponse.data.errors[0].message || 'GetProductiveTime failed');
        }

        const userId = userIdResponse.data.data.user.id;
        const res = await fetcher(token, {
            login: username,
            userId: userId,
            until: until,
            since: since,
            from: since,
            to: until
        });

        assertNoGraphQLErrors(res, 'GetProductiveTime failed');

        const groups: Array<{name: string; nameWithOwner: string; dates: Date[]}> = [];
        res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
            (node: {
                repository: {
                    defaultBranchRef: {target: {history: {edges: any[]}}} | null;
                    name: string;
                    nameWithOwner: string;
                };
            }) => {
                if (node.repository.defaultBranchRef != null) {
                    const dates: Date[] = [];
                    node.repository.defaultBranchRef.target.history.edges.forEach(edge => {
                        dates.push(edge.node.authoredDate);
                    });
                    groups.push({
                        name: node.repository.name,
                        nameWithOwner: node.repository.nameWithOwner,
                        dates: dates
                    });
                }
            }
        );
        return groups;
    });

    const productiveTime = new ProfuctiveTime();
    repoGroups.forEach(group => {
        // Same matching rules as the language cards: case-insensitive on the
        // bare repo name or the owner/repo form.
        if (
            excludeRepos.includes((group.name ?? '').toLowerCase()) ||
            excludeRepos.includes((group.nameWithOwner ?? '').toLowerCase())
        ) {
            return;
        }
        group.dates.forEach(date => productiveTime.addProductiveDate(date));
    });
    return productiveTime;
}
