import {getOrganizationCommitLanguage} from '../../src/github-api/organization-commits-per-language';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const data = {
    data: {
        repositoryOwner: {
            __typename: 'Organization',
            repositories: {
                nodes: [
                    {
                        primaryLanguage: {
                            name: 'Rust',
                            color: '#dea584'
                        },
                        defaultBranchRef: {
                            target: {
                                history: {
                                    totalCount: 99
                                }
                            }
                        }
                    },
                    {
                        primaryLanguage: {
                            name: 'JavaScript',
                            color: '#f1e05a'
                        },
                        defaultBranchRef: {
                            target: {
                                history: {
                                    totalCount: 84
                                }
                            }
                        }
                    },
                    {
                        primaryLanguage: {
                            name: 'Rust',
                            color: '#dea584'
                        },
                        defaultBranchRef: {
                            target: {
                                history: {
                                    totalCount: 100
                                }
                            }
                        }
                    },
                    {
                        primaryLanguage: {
                            name: 'Jupyter Notebook',
                            color: '#f18e33'
                        },
                        defaultBranchRef: {
                            target: {
                                history: {
                                    totalCount: 75
                                }
                            }
                        }
                    },
                    {
                        primaryLanguage: null,
                        defaultBranchRef: {
                            target: {
                                history: {
                                    totalCount: 100
                                }
                            }
                        }
                    },
                    {
                        primaryLanguage: {
                            name: 'Go',
                            color: '#00ADD8'
                        },
                        defaultBranchRef: null
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

describe('organization commit contributions on github', () => {
    it('should sum commit counts by primary language', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, data);
        const totalContributions = await getOrganizationCommitLanguage('acme', [], 'token');
        expect(totalContributions).toEqual({
            languageMap: new Map([
                ['Rust', {color: '#dea584', count: 199, name: 'Rust'}],
                ['JavaScript', {color: '#f1e05a', count: 84, name: 'JavaScript'}],
                ['Jupyter Notebook', {color: '#f18e33', count: 75, name: 'Jupyter Notebook'}]
            ])
        });
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getOrganizationCommitLanguage('acme', [], 'token')).rejects.toThrow('GitHub api failed');
    });

    it('should do a case-insensitive comparison for language exclusion', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, data);
        const repoData = await getOrganizationCommitLanguage('acme', ['jupyter notebook'], 'token');
        expect(repoData).toEqual({
            languageMap: new Map([
                ['Rust', {color: '#dea584', count: 199, name: 'Rust'}],
                ['JavaScript', {color: '#f1e05a', count: 84, name: 'JavaScript'}]
            ])
        });
    });

    it('should throw a clear error when the organization is not found', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, notFound);
        await expect(getOrganizationCommitLanguage('not-an-org', [], 'token')).rejects.toThrow(
            'Organization not found: not-an-org'
        );
    });
});
