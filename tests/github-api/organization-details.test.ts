import {getOrganizationDetails} from '../../src/github-api/organization-details';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const firstPage = {
    data: {
        repositoryOwner: {
            __typename: 'Organization',
            id: 'orgID',
            login: 'acme',
            name: 'Acme Corp',
            description: 'A test organization',
            email: 'contact@acme.example',
            location: 'Internet',
            websiteUrl: 'https://acme.example',
            twitterUsername: 'acme',
            createdAt: '2015-01-01T00:00:00Z',
            isVerified: true,
            repositories: {
                totalCount: 3,
                nodes: [
                    {
                        createdAt: '2020-01-01T00:00:00Z',
                        forkCount: 5,
                        stargazers: {totalCount: 100},
                        issues: {totalCount: 3}
                    },
                    {
                        createdAt: '2021-03-15T00:00:00Z',
                        forkCount: 2,
                        stargazers: {totalCount: 50},
                        issues: {totalCount: 1}
                    },
                    {
                        createdAt: '2022-06-30T00:00:00Z',
                        forkCount: 1,
                        stargazers: {totalCount: 25},
                        issues: {totalCount: 0}
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

describe('github api for organization details', () => {
    it('should aggregate repo data from the top-100 query', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, firstPage);
        const orgDetails = await getOrganizationDetails('acme', 'token');
        expect(orgDetails).toEqual({
            id: 'orgID',
            login: 'acme',
            name: 'Acme Corp',
            description: 'A test organization',
            email: 'contact@acme.example',
            location: 'Internet',
            websiteUrl: 'https://acme.example',
            twitterUsername: 'acme',
            createdAt: '2015-01-01T00:00:00Z',
            isVerified: true,
            totalPublicRepos: 3,
            totalStars: 175,
            totalForks: 8,
            totalOpenIssues: 4,
            repoCreatedAt: [
                new Date('2020-01-01T00:00:00Z'),
                new Date('2021-03-15T00:00:00Z'),
                new Date('2022-06-30T00:00:00Z')
            ]
        });
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getOrganizationDetails('acme', 'token')).rejects.toThrow('GitHub api failed');
    });

    it('should throw when organization is not found', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, notFound);
        await expect(getOrganizationDetails('not-an-org', 'token')).rejects.toThrow(
            'Organization not found: not-an-org'
        );
    });
});
