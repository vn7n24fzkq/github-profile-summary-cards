import * as core from '@actions/core';
import {sendAnalytics} from './utils/analytics';
import {createProfileDetailsCard} from './cards/profile-details-card';
import {createReposPerLanguageCard} from './cards/repos-per-language-card';
import {createCommitsPerLanguageCard} from './cards/most-commit-language-card';
import {createStatsCard} from './cards/stats-card';
import {createProductiveTimeCard} from './cards/productive-time-card';
import {createOrganizationProfileDetailsCard} from './cards/organization-profile-details-card';
import {createOrganizationReposPerLanguageCard} from './cards/organization-repos-per-language-card';
import {createOrganizationCommitsPerLanguageCard} from './cards/organization-most-commit-language-card';
import {createOrganizationStatsCard} from './cards/organization-stats-card';
import {getOwnerType, OwnerType} from './github-api/owner-type';
import {spawn} from 'child_process';
import {parseExcludeLanguages} from './utils/translator';
import {OUTPUT_PATH, generatePreviewMarkdown} from './utils/file-writer';
import {ThemeMap} from './const/theme';
import {parseAnimation} from './utils/animation';
import {CardGenerationOptions} from './utils/card-generation';

const execCmd = (cmd: string, args: string[] = []) =>
    new Promise((resolve, reject) => {
        const app = spawn(cmd, args, {stdio: 'pipe'});
        let stdout = '';
        app.stdout.on('data', data => {
            stdout += data;
        });
        app.on('close', code => {
            if (code !== 0 && !stdout.includes('nothing to commit')) {
                const err = new Error(`${cmd} ${args} \n ${stdout} \n Invalid status code: ${code}`);
                return reject(err);
            }
            return resolve(code);
        });
        app.on('error', reject);
    });

// ProfileSummaryCardsTemplate
const commitFile = async () => {
    await execCmd('git', ['config', '--global', 'user.email', 'profile-summary-cards-bot@example.com']);
    await execCmd('git', ['config', '--global', 'user.name', 'profile-summary-cards[bot]']);
    await execCmd('git', ['add', OUTPUT_PATH]);
    await execCmd('git', ['commit', '-m', 'Generate profile summary cards']);
    await execCmd('git', ['push']);
};

const generateUserCards = async (
    username: string,
    utcOffset: number,
    exclude: Array<string>,
    token: string,
    options: CardGenerationOptions = {}
) => {
    // ProfileDetailsCard
    try {
        core.info(`Creating ProfileDetailsCard...`);
        await createProfileDetailsCard(username, token, options);
        await sendAnalytics('action_profile_details_card', {username});
    } catch (error: any) {
        core.error(`Error when creating ProfileDetailsCard \n${error.stack}`);
    }

    // ReposPerLanguageCard
    try {
        core.info(`Creating ReposPerLanguageCard...`);
        await createReposPerLanguageCard(username, exclude, token, options);
    } catch (error: any) {
        core.error(`Error when creating ReposPerLanguageCard \n${error.stack}`);
    }

    // CommitsPerLanguageCard
    try {
        core.info(`Creating CommitsPerLanguageCard...`);
        await createCommitsPerLanguageCard(username, exclude, token, options);
    } catch (error: any) {
        core.error(`Error when creating CommitsPerLanguageCard \n${error.stack}`);
    }

    // StatsCard
    try {
        core.info(`Creating StatsCard...`);
        await createStatsCard(username, token, options);
    } catch (error: any) {
        core.error(`Error when creating StatsCard \n${error.stack}`);
    }

    // ProductiveTimeCard
    try {
        core.info(`Creating ProductiveTimeCard...`);
        await createProductiveTimeCard(username, utcOffset, token, options);
    } catch (error: any) {
        core.error(`Error when creating ProductiveTimeCard \n${error.stack}`);
    }
};

const generateOrganizationCards = async (
    login: string,
    exclude: Array<string>,
    token: string,
    options: CardGenerationOptions = {}
) => {
    // ProfileDetailsCard
    try {
        core.info(`Creating Organization ProfileDetailsCard...`);
        await createOrganizationProfileDetailsCard(login, token, options);
        await sendAnalytics('action_organization_profile_details_card', {username: login});
    } catch (error: any) {
        core.error(`Error when creating Organization ProfileDetailsCard \n${error.stack}`);
    }

    // ReposPerLanguageCard
    try {
        core.info(`Creating Organization ReposPerLanguageCard...`);
        await createOrganizationReposPerLanguageCard(login, exclude, token, options);
    } catch (error: any) {
        core.error(`Error when creating Organization ReposPerLanguageCard \n${error.stack}`);
    }

    // CommitsPerLanguageCard
    try {
        core.info(`Creating Organization CommitsPerLanguageCard...`);
        await createOrganizationCommitsPerLanguageCard(login, exclude, token, options);
    } catch (error: any) {
        core.error(`Error when creating Organization CommitsPerLanguageCard \n${error.stack}`);
    }

    // StatsCard
    try {
        core.info(`Creating Organization StatsCard...`);
        await createOrganizationStatsCard(login, token, options);
    } catch (error: any) {
        core.error(`Error when creating Organization StatsCard \n${error.stack}`);
    }

    core.info(
        'Skipping ProductiveTimeCard: this card is not available for organization accounts. It relies on per-user contribution data that GitHub does not expose at the organization level.'
    );
};

// main
const action = async () => {
    core.info(`Start...`);
    if (!process.env.GITHUB_TOKEN) {
        core.setFailed('GITHUB_TOKEN is missing. Please check your workflow configuration.');
        return;
    }
    const username = core.getInput('USERNAME', {required: true});
    core.info(`Username: ${username}`);
    const utcOffset = Number(core.getInput('UTC_OFFSET', {required: false}));
    core.info(`UTC offset: ${utcOffset}`);
    const exclude = parseExcludeLanguages(core.getInput('EXCLUDE', {required: false}));
    core.info(`Excluded languages: ${exclude}`);
    const autoPush = core.getBooleanInput('AUTO_PUSH', {required: false});
    core.info(`You ${autoPush ? 'have' : "haven't"} set automatically push commits`);

    // Optional generation controls, all independent: THEME pins output to a single
    // theme (default: all themes); ANIMATION bakes a CSS animation into the SVGs
    // (default: none); DURATION sets the animation speed; NAME overrides the
    // profile-details title.
    const themeInput = core.getInput('THEME', {required: false}).trim();
    if (themeInput && !ThemeMap.has(themeInput)) {
        core.setFailed(`THEME "${themeInput}" does not exist. See the theme list in the README.`);
        return;
    }
    const animationInput = core.getInput('ANIMATION', {required: false}).trim();
    const animation = parseAnimation(animationInput);
    if (animationInput && !animation) {
        core.warning(`ANIMATION "${animationInput}" is not a supported value; generating without animation.`);
    }
    const duration = core.getInput('DURATION', {required: false}).trim() || undefined;
    const displayName = core.getInput('NAME', {required: false}).trim() || undefined;
    const options: CardGenerationOptions = {theme: themeInput || undefined, animation, duration, displayName};
    core.info(
        `Theme: ${themeInput || 'all'}; Animation: ${animation ?? 'none'}; Duration: ${duration ?? '(default)'}; Name: ${displayName ?? '(default)'}`
    );

    try {
        // Remove old output
        core.info(`Remove old cards...`);
        await execCmd('sudo', ['rm', '-rf', OUTPUT_PATH]);

        let ownerType: OwnerType;
        try {
            ownerType = await getOwnerType(username, process.env.GITHUB_TOKEN!);
            core.info(`Detected owner type: ${ownerType}`);
        } catch (error: any) {
            core.error(`Error when detecting owner type \n${error.stack}`);
            throw error;
        }

        if (ownerType === 'Organization') {
            await generateOrganizationCards(username, exclude, process.env.GITHUB_TOKEN!, options);
        } else {
            await generateUserCards(username, utcOffset, exclude, process.env.GITHUB_TOKEN!, options);
        }

        // generate markdown
        try {
            core.info(`Creating preview markdown...`);
            generatePreviewMarkdown(true, ownerType);
        } catch (error: any) {
            core.error(`Error when creating preview markdown \n${error.stack}`);
        }

        // Commit changes
        if (autoPush) {
            core.info(`Commit file...`);
            let retry = 0;
            const maxRetry = 3;
            while (retry < maxRetry) {
                retry += 1;
                try {
                    await commitFile();
                    break; // success — stop retrying
                } catch (error) {
                    if (retry == maxRetry) {
                        throw error;
                    }
                    core.warning(`Commit failed. Retry...`);
                }
            }
        }
    } catch (error: any) {
        core.error(error);
        core.setFailed(error.message);
    }
};

const main = async (username: string, utcOffset: number, exclude: Array<string>) => {
    // Fail fast if no token is present rather than letting an undefined value
    // propagate as a bearer header and surface as a confusing 401.
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('GITHUB_TOKEN is not set. Add it to a .env file at the repo root or export it before running.');
        process.exit(1);
    }
    try {
        const ownerType = await getOwnerType(username, token);
        if (ownerType === 'Organization') {
            await createOrganizationProfileDetailsCard(username, token);
            await createOrganizationReposPerLanguageCard(username, exclude, token);
            await createOrganizationCommitsPerLanguageCard(username, exclude, token);
            await createOrganizationStatsCard(username, token);
            console.info(
                'Skipping ProductiveTimeCard: this card is not available for organization accounts. It relies on per-user contribution data that GitHub does not expose at the organization level.'
            );
        } else {
            await createProfileDetailsCard(username, token);
            await createReposPerLanguageCard(username, exclude, token);
            await createCommitsPerLanguageCard(username, exclude, token);
            await createStatsCard(username, token);
            await createProductiveTimeCard(username, utcOffset, token);
        }
        generatePreviewMarkdown(false, ownerType);
    } catch (error: any) {
        console.error(error);
    }
};

// program entry point
// check if run in github action
if (process.argv.length == 2) {
    action();
} else {
    const username = process.argv[2];
    const utcOffset = Number(process.argv[3]);
    const exclude = parseExcludeLanguages(process.argv[4] ?? '');
    main(username, utcOffset, exclude);
}
