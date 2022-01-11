import * as core from '@actions/core';
import {createProfileDetailsCard} from './cards/profile-details-card';
import {createReposPerLanguageCard} from './cards/repos-per-language-card';
import {createCommitsPerLanguageCard} from './cards/most-commit-lauguage-card';
import {createStatsCard} from './cards/stats-card';
import {createProductiveTimeCard} from './cards/productive-time-card';
import {spawn} from 'child_process';
import {OUTPUT_PATH, generatePreviewMarkdown} from './utils/file-writer';

const execCmd = (cmd: string, args: string[] = []) =>
    new Promise((resolve, reject) => {
        const app = spawn(cmd, args, {stdio: 'pipe'});
        let stdout = '';
        app.stdout.on('data', data => {
            stdout = data;
        });
        app.on('close', code => {
            if (code !== 0 && !stdout.includes('nothing to commit')) {
                let err = new Error(`${cmd} ${args} \n ${stdout} \n Invalid status code: ${code}`);
                return reject(err);
            }
            return resolve(code);
        });
        app.on('error', reject);
    });

const commitFile = async () => {
    await execCmd('git', ['config', '--global', 'user.email', 'profile-summary-cards-bot@example.com']);
    await execCmd('git', ['config', '--global', 'user.name', 'profile-summary-cards[bot]']);
    await execCmd('git', ['add', OUTPUT_PATH]);
    await execCmd('git', ['commit', '-m', 'Generate profile summary cards']);
    await execCmd('git', ['push']);
};

// main
const main = async () => {
    core.info(`Start...`);
    let username = process.argv[2];
    let timezone = process.argv[3];
    let isInGithubAction = false;

    if (process.argv.length == 2) {
        try {
            username = core.getInput('USERNAME');
            timezone = core.getInput('TIMEZONE');
            isInGithubAction = true;
        } catch (error: any) {
            throw Error(error.message);
        }
    }
    try {
        // remove old output
        if (isInGithubAction) {
            core.info(`Remove old cards...`);
            await execCmd('sudo', ['rm', '-rf', OUTPUT_PATH]);
        }
        try {
            core.info(`Creating ProfileDetailsCard...`);
            await createProfileDetailsCard(username);
        } catch (error: any) {
            core.error(`Error when creating ProfileDetailsCard \n${error.stack}`);
        }
        try {
            core.info(`Creating ReposPerLanguageCard...`);
            await createReposPerLanguageCard(username);
        } catch (error: any) {
            core.error(`Error when creating ReposPerLanguageCard \n${error.stack}`);
        }
        try {
            core.info(`Creating CommitsPerLanguageCard...`);
            await createCommitsPerLanguageCard(username);
        } catch (error: any) {
            core.error(`Error when creating CommitsPerLanguageCard \n${error.stack}`);
        }
        try {
            core.info(`Creating StatsCard...`);
            await createStatsCard(username);
        } catch (error: any) {
            core.error(`Error when creating StatsCard \n${error.stack}`);
        }
        try {
            core.info(`Creating ProductiveTimeCard...`);
            await createProductiveTimeCard(username, timezone);
        } catch (error: any) {
            core.error(`Error when creating ProductiveTimeCard \n${error.stack}`);
        }
        try {
            core.info(`Creating preview markdown...`);
            generatePreviewMarkdown(isInGithubAction);
        } catch (error: any) {
            core.error(`Error when creating preview markdown \n${error.stack}`);
        }
        if (isInGithubAction) {
            core.info(`Commit file...`);
            let retry = 0;
            const maxRetry = 3;
            while (retry < maxRetry) {
                retry += 1;
                try {
                    await commitFile();
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

main();
