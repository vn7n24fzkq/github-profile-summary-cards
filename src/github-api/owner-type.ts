import request, {assertNoGraphQLErrors} from '../utils/request';

export type OwnerType = 'User' | 'Organization';

const fetcher = (token: string, variables: any) => {
    return request(
        {
            Authorization: `bearer ${token}`
        },
        {
            query: `
      query OwnerType($login: String!) {
        repositoryOwner(login: $login) {
          __typename
        }
      }
      `,
            variables
        }
    );
};

export async function getOwnerType(login: string, token: string): Promise<OwnerType> {
    const res = await fetcher(token, {
        login: login
    });

    assertNoGraphQLErrors(res, 'GetOwnerType failed');

    const owner = res.data.data.repositoryOwner;
    if (!owner) {
        throw Error(`Login not found: ${login}`);
    }

    const typename = owner.__typename;
    if (typename !== 'User' && typename !== 'Organization') {
        throw Error(`Unsupported owner type for ${login}: ${typename}`);
    }

    return typename;
}
