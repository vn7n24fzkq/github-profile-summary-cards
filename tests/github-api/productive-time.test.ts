import {getProductiveTime} from '../../src/github-api/productive-time';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

afterEach(() => {
    mock.reset();
});

describe('github api for productive time', () => {
    it('should collect authored dates from commit history', async () => {
        mock.onPost('https://api.github.com/graphql').replyOnce(200, {data: {user: {id: 'MDQ6VXNlcjE='}}});
        mock.onPost('https://api.github.com/graphql').replyOnce(200, {
            data: {
                user: {
                    contributionsCollection: {
                        commitContributionsByRepository: [
                            {
                                repository: {
                                    name: 'repo',
                                    defaultBranchRef: {
                                        target: {
                                            history: {
                                                edges: [
                                                    {node: {authoredDate: '2026-01-01T10:00:00Z'}},
                                                    {node: {authoredDate: '2026-01-02T22:00:00Z'}}
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        });
        const result = await getProductiveTime('user-a', '2026-10-20T00:00:00Z', '2025-10-20T00:00:00Z', 'token');
        expect(result.productiveDate).toHaveLength(2);
    });

    it('should flag a rate-limited userId lookup as rotatable (isRateLimit)', async () => {
        // handleCard only rotates tokens when the thrown error carries
        // isRateLimit — a plain Error here used to kill rotation for this card.
        mock.onPost('https://api.github.com/graphql').reply(200, {
            errors: [{type: 'RATE_LIMITED', message: 'API rate limit already exceeded for installation ID 123.'}]
        });
        await expect(
            getProductiveTime('user-b', '2026-10-20T00:00:00Z', '2025-10-20T00:00:00Z', 'token')
        ).rejects.toMatchObject({isRateLimit: true});
    });
});
