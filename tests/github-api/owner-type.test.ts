import {getOwnerType} from '../../src/github-api/owner-type';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const mock = new MockAdapter(axios);

afterEach(() => {
    mock.reset();
});

// The type lookup rides the REST API (GET /users/:login) — see owner-type.ts.
describe('github api for owner type', () => {
    it('should return User for a user login', async () => {
        mock.onGet('https://api.github.com/users/vn7n24fzkq').reply(200, {login: 'vn7n24fzkq', type: 'User'});
        const ownerType = await getOwnerType('vn7n24fzkq', 'token');
        expect(ownerType).toBe('User');
    });

    it('should return Organization for an org login', async () => {
        mock.onGet('https://api.github.com/users/microsoft').reply(200, {login: 'microsoft', type: 'Organization'});
        const ownerType = await getOwnerType('microsoft', 'token');
        expect(ownerType).toBe('Organization');
    });

    it('should throw when login is not found', async () => {
        mock.onGet('https://api.github.com/users/not-a-real-login').reply(404, {message: 'Not Found'});
        await expect(getOwnerType('not-a-real-login', 'token')).rejects.toThrow('Login not found: not-a-real-login');
    });

    it('should throw on unsupported owner types', async () => {
        mock.onGet('https://api.github.com/users/ghost-bot').reply(200, {login: 'ghost-bot', type: 'Bot'});
        await expect(getOwnerType('ghost-bot', 'token')).rejects.toThrow('Unsupported owner type for ghost-bot');
    });

    it('should throw error when api failed', async () => {
        // 400 is outside retry-axios's retry ranges, so the failure is immediate.
        mock.onGet('https://api.github.com/users/vn7n24fzkq').reply(400, {message: 'Bad request'});
        await expect(getOwnerType('vn7n24fzkq', 'token')).rejects.toThrow('Request failed with status code 400');
    });
});
