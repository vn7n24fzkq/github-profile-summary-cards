import getRepoLanguage from '../../src/github-api/repos-per-language';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const firstData = {
    data: {
        user: {
            repositories: {
                nodes: [
                    {
                        primaryLanguage: {
                            color: '#b07219',
                            name: 'Java',
                        },
                    },
                    {
                        primaryLanguage: {
                            color: '#dea584',
                            name: 'Rust',
                        },
                    },
                ],
                pageInfo: {
                    endCursor: 'ABCD29yOnYyOpHOBslODA==',
                    hasNextPage: true,
                },
            },
        },
    },
};
const lastData = {
    data: {
        user: {
            repositories: {
                nodes: [
                    {
                        primaryLanguage: {
                            color: '#b07219',
                            name: 'Java',
                        },
                    },
                    {
                        primaryLanguage: {
                            color: '#f18e33',
                            name: 'Kotlin',
                        },
                    },
                ],
                pageInfo: {
                    endCursor: null,
                    hasNextPage: false,
                },
            },
        },
    },
};

const error = {
    errors: [
        {
            type: 'NOT_FOUND',
            path: ['user'],
            locations: [],
            message: 'GitHub api failed',
        },
    ],
};

afterEach(() => {
    mock.reset();
});

describe('repos per language on github', () => {
    it('should get correct data', async () => {
        mock.onPost('https://api.github.com/graphql')
            .replyOnce(200, firstData)
            .onPost('https://api.github.com/graphql')
            .replyOnce(200, lastData)
            .onAny();
        const repoData = await getRepoLanguage('vn7n24fzkq');
        expect(repoData).toEqual(
            new Map([
                ['Java', { color: '#b07219', count: 2 }],
                ['Rust', { color: '#dea584', count: 1 }],
                ['Kotlin', { color: '#f18e33', count: 1 }],
            ])
        );
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getRepoLanguage('vn7n24fzkq')).rejects.toThrow(
            'GitHub api failed'
        );
    });
});
