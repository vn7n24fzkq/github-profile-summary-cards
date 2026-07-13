import {getOrganizationRepoLanguages} from '../../src/github-api/organization-repos-per-language';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const firstData = {
    data: {
        repositoryOwner: {
            __typename: 'Organization',
            repositories: {
                nodes: [
                    {primaryLanguage: {color: '#b07219', name: 'Java'}},
                    {primaryLanguage: {color: '#dea584', name: 'Rust'}},
                    {primaryLanguage: {color: '#b07219', name: 'Java'}},
                    {primaryLanguage: {color: '#f18e33', name: 'Kotlin'}}
                ]
            }
        }
    }
};

const lastData = {
    data: {
        repositoryOwner: {
            __typename: 'Organization',
            repositories: {
                nodes: [
                    {
                        primaryLanguage: {
                            color: '#b07219',
                            name: 'Java'
                        }
                    },
                    {
                        primaryLanguage: {
                            color: '#f18e33',
                            name: 'Kotlin'
                        }
                    }
                ],
                pageInfo: {
                    endCursor: null,
                    hasNextPage: false
                }
            }
        }
    }
};

const error = {
    errors: [
        {
            type: 'NOT_FOUND',
            path: ['organization'],
            locations: [],
            message: 'GitHub api failed'
        }
    ]
};

const notFound = {
    data: {
        repositoryOwner: null
    }
};

afterEach(() => {
    mock.reset();
});

describe('organization repos per language on github', () => {
    it('should get correct data', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, firstData);
        const repoData = await getOrganizationRepoLanguages('acme', [], 'token');
        expect(repoData).toEqual({
            languageMap: new Map([
                ['Java', {color: '#b07219', count: 2, name: 'Java'}],
                ['Rust', {color: '#dea584', count: 1, name: 'Rust'}],
                ['Kotlin', {color: '#f18e33', count: 1, name: 'Kotlin'}]
            ])
        });
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getOrganizationRepoLanguages('acme', [], 'token')).rejects.toThrow('GitHub api failed');
    });

    it('should do a case-insensitive comparison for language exclusion', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, lastData);
        const repoData = await getOrganizationRepoLanguages('acme', ['java'], 'token');
        expect(repoData).toEqual({
            languageMap: new Map([['Kotlin', {color: '#f18e33', count: 1, name: 'Kotlin'}]])
        });
    });

    it('should throw a clear error when the organization is not found', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, notFound);
        await expect(getOrganizationRepoLanguages('not-an-org', [], 'token')).rejects.toThrow(
            'Organization not found: not-an-org'
        );
    });
});
