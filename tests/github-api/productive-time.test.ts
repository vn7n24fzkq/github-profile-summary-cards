import {getProductiveTime} from '../../src/github-api/productive-time';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const userIdData = {
    data: {
        user: {
            id: 'USER_ID'
        }
    }
};

const repoGroup = function (name: string, owner: string, dates: Array<string>) {
    return {
        repository: {
            defaultBranchRef: {
                target: {
                    history: {
                        edges: dates.map(date => ({
                            node: {message: 'commit', author: {email: 'mail@example.com'}, authoredDate: date}
                        }))
                    }
                }
            },
            name: name,
            nameWithOwner: `${owner}/${name}`
        }
    };
};

const productiveData = {
    data: {
        user: {
            contributionsCollection: {
                commitContributionsByRepository: [
                    repoGroup('alpha', 'me', ['2026-01-01T10:00:00Z', '2026-01-02T11:00:00Z']),
                    repoGroup('Beta', 'me', ['2026-01-03T12:00:00Z']),
                    {repository: {defaultBranchRef: null, name: 'empty', nameWithOwner: 'me/empty'}}
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

// distinct since/until per test so the shared data cache never collides
const window = function (tag: string) {
    return {since: `since-${tag}`, until: `until-${tag}`};
};

describe('getProductiveTime', () => {
    beforeEach(() => {
        mock.reset();
    });

    it('collects authored dates from every repository', async () => {
        mock.onPost().replyOnce(200, userIdData).onPost().replyOnce(200, productiveData);
        const {since, until} = window('all');
        const productiveTime = await getProductiveTime('abda', until, since, 'token');
        expect(productiveTime.productiveDate.length).toEqual(3);
    });

    it('skips repositories listed in excludeRepos, case-insensitively', async () => {
        mock.onPost().replyOnce(200, userIdData).onPost().replyOnce(200, productiveData);
        const {since, until} = window('name');
        const productiveTime = await getProductiveTime('abda', until, since, 'token', ['beta']);
        expect(productiveTime.productiveDate.length).toEqual(2);
    });

    it('matches owner/repo entries in excludeRepos', async () => {
        mock.onPost().replyOnce(200, userIdData).onPost().replyOnce(200, productiveData);
        const {since, until} = window('owner');
        const productiveTime = await getProductiveTime('abda', until, since, 'token', ['me/alpha']);
        expect(productiveTime.productiveDate.length).toEqual(1);
    });

    it('throws when the api responds with an error', async () => {
        mock.onPost().replyOnce(200, error);
        const {since, until} = window('error');
        await expect(getProductiveTime('abda', until, since, 'token')).rejects.toThrow();
    });
});
