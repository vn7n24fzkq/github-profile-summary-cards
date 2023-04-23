import request from '../utils/request';

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

// We use commit datetime to calculate productive time
const fetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query ProductiveTime($login: String!,$userId: ID!,$until: GitTimestamp!,,$since: GitTimestamp!) {
        user(login: $login) {
          contributionsCollection{
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
                            committedDate
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
export async function getProductiveTime(username: string, until: string, since: string): Promise<ProfuctiveTime> {
    const userIdResponse = await userIdFetcher(process.env.GITHUB_TOKEN!, {
        login: username
    });

    if (userIdResponse.data.errors) {
        throw Error(userIdResponse.data.errors[0].message || 'GetProductiveTime failed');
    }

    const userId = userIdResponse.data.data.user.id;
    const res = await fetcher(process.env.GITHUB_TOKEN!, {
        login: username,
        userId: userId,
        until: until,
        since: since
    });

    if (res.data.errors) {
        throw Error(res.data.errors[0].message || 'GetProductiveTime failed');
    }

    const productiveTime = new ProfuctiveTime();
    res.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(
        (node: {
            repository: {
                defaultBranchRef: {target: {history: {edges: any[]}}} | null;
            };
        }) => {
            if (node.repository.defaultBranchRef != null) {
                node.repository.defaultBranchRef.target.history.edges.forEach(node => {
                    productiveTime.addProductiveDate(node.node.committedDate);
                });
            }
        }
    );

    return productiveTime;
}
