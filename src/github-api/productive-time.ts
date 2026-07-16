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
    token: string
): Promise<ProfuctiveTime> {
    // The since/until window shifts with the current date, so it's part of the
    // key — plain commit-date strings are cached, Date-like usage stays outside.
    // v3: the collection window is now pinned to since/until (repo list changed).
    const authoredDates = await withDataCache(`v3:pt:${username.toLowerCase()}:${since}:${until}`, async () => {
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

        const dates: Date[] = [];
        res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
            (node: {
                repository: {
                    defaultBranchRef: {target: {history: {edges: any[]}}} | null;
                };
            }) => {
                if (node.repository.defaultBranchRef != null) {
                    node.repository.defaultBranchRef.target.history.edges.forEach(edge => {
                        dates.push(edge.node.authoredDate);
                    });
                }
            }
        );
        return dates;
    });

    const productiveTime = new ProfuctiveTime();
    authoredDates.forEach(date => productiveTime.addProductiveDate(date));
    return productiveTime;
}
