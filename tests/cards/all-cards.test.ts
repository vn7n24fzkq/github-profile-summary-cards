import {createProfileDetailsCard} from '../../src/cards/profile-details-card';
import {createReposPerLanguageCard} from '../../src/cards/repos-per-language-card';
import {createCommitsPerLanguageCard} from '../../src/cards/most-commit-language-card';
import {createProductiveTimeCard} from '../../src/cards/productive-time-card';
import {createStatsCard} from '../../src/cards/stats-card';
import {writeSVG} from '../../src/utils/file-writer';
import {getProfileDetails} from '../../src/github-api/profile-details';
import {getRepoLanguages} from '../../src/github-api/repos-per-language';
import {getCommitLanguage} from '../../src/github-api/commits-per-language';
import {getProductiveTime} from '../../src/github-api/productive-time';
import {getContributionByYear} from '../../src/github-api/contributions-by-year';

// Mock all dependencies
jest.mock('../../src/utils/file-writer');
jest.mock('../../src/github-api/profile-details');
jest.mock('../../src/github-api/repos-per-language');
jest.mock('../../src/github-api/commits-per-language');
jest.mock('../../src/github-api/productive-time');
jest.mock('../../src/github-api/contributions-by-year');

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
        (getCommitLanguage as jest.Mock).mockResolvedValue({
            getLanguageMap: () => new Map([['TypeScript', {count: 500, color: '#abcdef'}]])
        });
        (getProductiveTime as jest.Mock).mockResolvedValue({
            productiveDate: [new Date().toISOString()]
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
});
