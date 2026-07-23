import {getRepoLanguages} from '../../src/github-api/repos-per-language';
import {VERCEL_MAX_REPO_PAGES} from '../../src/const/pagination';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const singlePageData = {
    data: {
        user: {
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

const page1 = {
    data: {
        user: {
            repositories: {
                nodes: [
                    {primaryLanguage: {color: '#b07219', name: 'Java'}},
                    {primaryLanguage: {color: '#dea584', name: 'Rust'}}
                ],
                pageInfo: {endCursor: 'C1', hasNextPage: true}
            }
        }
    }
};
const page2 = {
    data: {
        user: {
            repositories: {
                nodes: [{primaryLanguage: {color: '#f18e33', name: 'Kotlin'}}],
                pageInfo: {endCursor: null, hasNextPage: false}
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

const dataContainingLanguageWithWhiteSpace = {
    data: {
        user: {
            repositories: {
                nodes: [
                    {
                        primaryLanguage: {
                            color: '#b07219',
                            name: 'Rust'
                        }
                    },
                    {
                        primaryLanguage: {
                            color: '#f18e33',
                            name: 'Kotlin'
                        }
                    },
                    {
                        primaryLanguage: {
                            color: '#f1948a',
                            name: 'Jupyter Notebook'
                        }
                    },
                    {
                        primaryLanguage: {
                            color: '#f9e79f',
                            name: 'Java'
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

afterEach(() => {
    mock.reset();
    delete process.env.VERCEL;
});

describe('repos per language on github', () => {
    it('should get correct data', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, singlePageData);
        const repoData = await getRepoLanguages('vn7n24fzkq', [], 'token');
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
        await expect(getRepoLanguages('vn7n24fzkq', [], 'token')).rejects.toThrow('GitHub api failed');
    });

    it('should do a case-insensitive comparison for language exclusion', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, dataContainingLanguageWithWhiteSpace);
        const repoData = await getRepoLanguages('vn7n24fzkq', ['rust', 'jupyter notebook'], 'token');
        expect(repoData).toEqual({
            languageMap: new Map([
                ['Kotlin', {color: '#f18e33', count: 1, name: 'Kotlin'}],
                ['Java', {color: '#f9e79f', count: 1, name: 'Java'}]
            ])
        });
    });

    it('excludes repos by name (case-insensitive)', async () => {
        const dataWithRepoNames = {
            data: {
                user: {
                    repositories: {
                        nodes: [
                            {
                                name: 'Dotfiles',
                                nameWithOwner: 'vn7n24fzkq/Dotfiles',
                                primaryLanguage: {color: '#89e051', name: 'Shell'}
                            },
                            {
                                name: 'my-app',
                                nameWithOwner: 'vn7n24fzkq/my-app',
                                primaryLanguage: {color: '#b07219', name: 'Java'}
                            },
                            {
                                name: 'my-fork',
                                nameWithOwner: 'vn7n24fzkq/my-fork',
                                primaryLanguage: {color: '#dea584', name: 'Rust'}
                            }
                        ],
                        pageInfo: {endCursor: null, hasNextPage: false}
                    }
                }
            }
        };
        mock.onPost('https://api.github.com/graphql').reply(200, dataWithRepoNames);
        // one plain name, one owner/repo form — both must match
        const repoData = await getRepoLanguages('vn7n24fzkq', [], 'token', ['dotfiles', 'vn7n24fzkq/my-fork']);
        expect(repoData).toEqual({
            languageMap: new Map([['Java', {color: '#b07219', count: 1, name: 'Java'}]])
        });
    });

    it('paginates through every page when not on Vercel (Action/CLI)', async () => {
        delete process.env.VERCEL;
        mock.onPost('https://api.github.com/graphql')
            .replyOnce(200, page1)
            .onPost('https://api.github.com/graphql')
            .replyOnce(200, page2)
            .onAny();
        const repoData = await getRepoLanguages('vn7n24fzkq', [], 'token');
        // second page's Kotlin is included → pagination happened
        expect(repoData.getLanguageMap().has('Kotlin')).toBe(true);
    });

    // On Vercel the fetch goes through REST (GET /users/:login/repos) instead of
    // GraphQL — same node shape, colors from the bundled linguist map, and the
    // (week-cached) type lookup re-creates the "user pipeline rejects orgs"
    // contract that dispatch relies on.
    describe('on Vercel (REST)', () => {
        const restRepo = (name: string, language: string | null, fork = false) => ({
            name,
            full_name: `vn7n24fzkq/${name}`,
            fork,
            language
        });

        const mockOwnerType = (type: string) =>
            mock.onGet('https://api.github.com/users/vn7n24fzkq').reply(200, {login: 'vn7n24fzkq', type});

        it('paginates on Vercel too (accuracy fix)', async () => {
            process.env.VERCEL = '1';
            mockOwnerType('User');
            // page 1 is full (100 repos) so pagination continues; page 2 is short.
            const fullPage = Array.from({length: 100}, (_, i) => restRepo(`java-${i}`, 'Java'));
            mock.onGet('https://api.github.com/users/vn7n24fzkq/repos').reply(config => {
                return [200, config.params.page === 1 ? fullPage : [restRepo('the-kotlin-one', 'Kotlin')]];
            });
            const repoData = await getRepoLanguages('vn7n24fzkq', [], 'token');
            // page 2's Kotlin is included → Vercel no longer stops at 100 repos
            expect(repoData.getLanguageMap().has('Kotlin')).toBe(true);
            expect(repoData.getLanguageMap().has('Java')).toBe(true);
        });

        it('caps pagination at VERCEL_MAX_REPO_PAGES on Vercel', async () => {
            process.env.VERCEL = '1';
            mockOwnerType('User');
            let requests = 0;
            // every page is full, so only the cap can stop the walk
            mock.onGet('https://api.github.com/users/vn7n24fzkq/repos').reply(() => {
                requests += 1;
                return [200, Array.from({length: 100}, (_, i) => restRepo(`repo-${requests}-${i}`, 'Java'))];
            });
            await getRepoLanguages('vn7n24fzkq', [], 'token');
            expect(requests).toBe(VERCEL_MAX_REPO_PAGES);
        });

        it('skips forks and fills colors from the bundled linguist map', async () => {
            process.env.VERCEL = '1';
            mockOwnerType('User');
            mock.onGet('https://api.github.com/users/vn7n24fzkq/repos').reply(200, [
                restRepo('app', 'Java'),
                restRepo('a-fork', 'Java', true),
                restRepo('no-language', null)
            ]);
            const repoData = await getRepoLanguages('vn7n24fzkq', [], 'token');
            // the fork and the language-less repo are dropped; Java gets its
            // linguist color even though REST reports the name only
            expect(repoData).toEqual({
                languageMap: new Map([['Java', {color: '#b07219', count: 1, name: 'Java'}]])
            });
        });

        it('rejects org logins so the user/org dispatch still falls through', async () => {
            process.env.VERCEL = '1';
            mockOwnerType('Organization');
            await expect(getRepoLanguages('vn7n24fzkq', [], 'token')).rejects.toThrow('Login is not a user');
        });
    });
});
