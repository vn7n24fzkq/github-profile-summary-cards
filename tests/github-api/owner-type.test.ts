import {getOwnerType} from '../../src/github-api/owner-type';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

const userData = {
    data: {
        repositoryOwner: {
            __typename: 'User'
        }
    }
};

const organizationData = {
    data: {
        repositoryOwner: {
            __typename: 'Organization'
        }
    }
};

const notFoundData = {
    data: {
        repositoryOwner: null
    }
};

const error = {
    errors: [
        {
            type: 'NOT_FOUND',
            path: ['repositoryOwner'],
            locations: [],
            message: 'GitHub api failed'
        }
    ]
};

afterEach(() => {
    mock.reset();
});

describe('github api for owner type', () => {
    it('should return User for a user login', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, userData);
        const ownerType = await getOwnerType('vn7n24fzkq', 'token');
        expect(ownerType).toBe('User');
    });

    it('should return Organization for an org login', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, organizationData);
        const ownerType = await getOwnerType('microsoft', 'token');
        expect(ownerType).toBe('Organization');
    });

    it('should throw when login is not found', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, notFoundData);
        await expect(getOwnerType('not-a-real-login', 'token')).rejects.toThrow('Login not found: not-a-real-login');
    });

    it('should throw error when api failed', async () => {
        mock.onPost('https://api.github.com/graphql').reply(200, error);
        await expect(getOwnerType('vn7n24fzkq', 'token')).rejects.toThrow('GitHub api failed');
    });
});
