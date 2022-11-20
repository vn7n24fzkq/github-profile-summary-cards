import {getCommitLanguage} from '../../src/github-api/commits-per-language';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const data = {
    data: {
        user: {
            contributionsCollection: {
                commitContributionsByRepository: [
                    {
                        repository: {
                            primaryLanguage: {
                                name: 'Rust',
                                color: '#dea584'
                            }
                        },
                        contributions: {
                            totalCount: 99
                        }
                    },
                    {
                        repository: {
                            primaryLanguage: {
                                name: 'JavaScript',
                                color: '#f1e05a'
                            }
                        },
                        contributions: {
                            totalCount: 84
                        }
                    },
                    {
                        repository: {
                            primaryLanguage: {
                                name: 'Rust',
                                color: '#dea584'
                            }
                        },
                        contributions: {
                            totalCount: 100
                        }
                    },
                    {
                        repository: {
                            primaryLanguage: null
                        },
                        contributions: {
                            totalCount: 100
                        }
                    }
                ]
            }
        }
    }
};

const error = {
    errors: [
        {
            type: 'NOT_FOUND',
            path: ['user'],
            locations: [],
            message: 'GitHub api failed'
        }
    ]
};

afterEach(() => {
    mock.reset();
});

describe('commit contributions on github', () => {
    it('should get correct commit contributions', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, data);
        const totalContributions = await getCommitLanguage('vn7n24fzkq', []);
        expect(totalContributions).toEqual({
            languageMap: new Map([
                ['Rust', {color: '#dea584', count: 199, name: 'Rust'}],
                ['JavaScript', {color: '#f1e05a', count: 84, name: 'JavaScript'}]
            ])
        });
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getCommitLanguage('vn7n24fzkq', [])).rejects.toThrow('GitHub api failed');
    });
});
