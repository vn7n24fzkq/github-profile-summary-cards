import {createProfileDetailsCard} from '../../src/cards/profile-details-card';
import {createReposPerLanguageCard} from '../../src/cards/repos-per-language-card';
import {createCommitsPerLanguageCard} from '../../src/cards/most-commit-language-card';
import {createProductiveTimeCard} from '../../src/cards/productive-time-card';
import {createStatsCard} from '../../src/cards/stats-card';
import {createOrganizationProfileDetailsCard} from '../../src/cards/organization-profile-details-card';
import {createOrganizationReposPerLanguageCard} from '../../src/cards/organization-repos-per-language-card';
import {createOrganizationCommitsPerLanguageCard} from '../../src/cards/organization-most-commit-language-card';
import {createOrganizationStatsCard} from '../../src/cards/organization-stats-card';
import {writeSVG} from '../../src/utils/file-writer';
import {getProfileDetails} from '../../src/github-api/profile-details';
import {getRepoLanguages} from '../../src/github-api/repos-per-language';
import {getCommitLanguageAllYears, getContributionYears} from '../../src/github-api/commits-per-language';
import {getProductiveTime} from '../../src/github-api/productive-time';
import {getContributionByYear} from '../../src/github-api/contributions-by-year';
import {getOrganizationDetails} from '../../src/github-api/organization-details';
import {getOrganizationRepoLanguages} from '../../src/github-api/organization-repos-per-language';
import {getOrganizationCommitLanguage} from '../../src/github-api/organization-commits-per-language';

// Mock all dependencies
jest.mock('../../src/utils/file-writer');
jest.mock('../../src/github-api/profile-details');
jest.mock('../../src/github-api/repos-per-language');
jest.mock('../../src/github-api/commits-per-language');
jest.mock('../../src/github-api/productive-time');
jest.mock('../../src/github-api/contributions-by-year');
jest.mock('../../src/github-api/organization-details');
jest.mock('../../src/github-api/organization-repos-per-language');
jest.mock('../../src/github-api/organization-commits-per-language');

const mockWriteSVG = writeSVG as jest.Mock;

describe('Cards Generation (Integration)', () => {
    const TOKEN = 'dummy_token';
    const USERNAME = 'testuser';

    beforeEach(() => {
        jest.resetAllMocks();

        // Setup default mock returns
        (getProfileDetails as jest.Mock).mockResolvedValue({
            name: 'Test User',
            email: 'test@example.com',
            contributionYears: [2024],
            totalPublicRepos: 10,
            totalStars: 100,
            totalPullRequestContributions: 5,
            totalIssueContributions: 5,
            totalRepositoryContributions: 2,
            contributions: [{date: new Date(), contributionCount: 5}],
            createdAt: '2020-01-01T00:00:00Z'
        });
        (getContributionByYear as jest.Mock).mockResolvedValue({
            totalContributions: 500,
            totalCommitContributions: 400
        });
        (getRepoLanguages as jest.Mock).mockResolvedValue({
            getLanguageMap: () => new Map([['TypeScript', {count: 100, color: '#abcdef'}]])
        });
        (getContributionYears as jest.Mock).mockResolvedValue([2024]);
        (getCommitLanguageAllYears as jest.Mock).mockResolvedValue({
            getLanguageMap: () => new Map([['TypeScript', {count: 500, color: '#abcdef'}]])
        });
        (getProductiveTime as jest.Mock).mockResolvedValue({
            productiveDate: [new Date().toISOString()]
        });
        (getOrganizationDetails as jest.Mock).mockResolvedValue({
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
            totalPublicRepos: 10,
            totalStars: 100,
            totalForks: 25,
            totalOpenIssues: 5,
            repoCreatedAt: [new Date('2020-01-01T00:00:00Z'), new Date('2021-06-15T00:00:00Z')]
        });
        (getOrganizationRepoLanguages as jest.Mock).mockResolvedValue({
            getLanguageMap: () => new Map([['TypeScript', {count: 100, color: '#abcdef'}]])
        });
        (getOrganizationCommitLanguage as jest.Mock).mockResolvedValue({
            getLanguageMap: () => new Map([['TypeScript', {count: 500, color: '#abcdef'}]])
        });
    });

    it('createProfileDetailsCard should write SVG', async () => {
        await createProfileDetailsCard(USERNAME, TOKEN);
        // Expect writeSVG to be called for each theme (we have ~30 themes)
        expect(mockWriteSVG).toHaveBeenCalled();
        expect(mockWriteSVG).toHaveBeenCalledWith(
            expect.any(String),
            '0-profile-details',
            expect.stringContaining('<svg')
        );
    });

    it('createReposPerLanguageCard should write SVG', async () => {
        await createReposPerLanguageCard(USERNAME, [], TOKEN);
        expect(mockWriteSVG).toHaveBeenCalled();
        expect(mockWriteSVG).toHaveBeenCalledWith(
            expect.any(String),
            '1-repos-per-language',
            expect.stringContaining('<svg')
        );
    });

    it('createCommitsPerLanguageCard should write SVG', async () => {
        await createCommitsPerLanguageCard(USERNAME, [], TOKEN);
        expect(mockWriteSVG).toHaveBeenCalled();
        expect(mockWriteSVG).toHaveBeenCalledWith(
            expect.any(String),
            '2-most-commit-language',
            expect.stringContaining('<svg')
        );
    });

    it('createStatsCard should write SVG', async () => {
        await createStatsCard(USERNAME, TOKEN);
        expect(mockWriteSVG).toHaveBeenCalled();
        expect(mockWriteSVG).toHaveBeenCalledWith(expect.any(String), '3-stats', expect.stringContaining('<svg'));
    });

    it('createProductiveTimeCard should write SVG', async () => {
        await createProductiveTimeCard(USERNAME, 0, TOKEN);
        expect(mockWriteSVG).toHaveBeenCalled();
        expect(mockWriteSVG).toHaveBeenCalledWith(
            expect.any(String),
            '4-productive-time',
            expect.stringContaining('<svg')
        );
    });

    it('createOrganizationProfileDetailsCard should write SVG', async () => {
        await createOrganizationProfileDetailsCard('acme', TOKEN);
        expect(mockWriteSVG).toHaveBeenCalled();
        expect(mockWriteSVG).toHaveBeenCalledWith(
            expect.any(String),
            '0-profile-details',
            expect.stringContaining('<svg')
        );
    });

    it('createOrganizationReposPerLanguageCard should write SVG', async () => {
        await createOrganizationReposPerLanguageCard('acme', [], TOKEN);
        expect(mockWriteSVG).toHaveBeenCalled();
        expect(mockWriteSVG).toHaveBeenCalledWith(
            expect.any(String),
            '1-repos-per-language',
            expect.stringContaining('<svg')
        );
    });

    it('createOrganizationCommitsPerLanguageCard should write SVG', async () => {
        await createOrganizationCommitsPerLanguageCard('acme', [], TOKEN);
        expect(mockWriteSVG).toHaveBeenCalled();
        expect(mockWriteSVG).toHaveBeenCalledWith(
            expect.any(String),
            '2-most-commit-language',
            expect.stringContaining('<svg')
        );
    });

    it('createOrganizationStatsCard should write SVG', async () => {
        await createOrganizationStatsCard('acme', TOKEN);
        expect(mockWriteSVG).toHaveBeenCalled();
        expect(mockWriteSVG).toHaveBeenCalledWith(expect.any(String), '3-stats', expect.stringContaining('<svg'));
    });
});
