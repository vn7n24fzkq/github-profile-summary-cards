const core = require('@actions/core');
const { createProfileDetailsCard } = require('./cards/profile-details-card');
const {
    createReposPerLanguageCard,
} = require('./cards/repos-per-language-card');
const {
    createCommitsPerLanguageCard,
} = require('./cards/most-commit-lauguage-card');
const { createStatsCard } = require('./cards/stats-card');
const { createProductiveTimeCard } = require('./cards/productive-time-card');
const { spawn } = require('child_process');
const { outputPath, generatePreviewMarkdown } = require('./utils/file-writer');

const execCmd = (cmd, args = []) =>
    new Promise((resolve, reject) => {
        const app = spawn(cmd, args, { stdio: 'pipe' });
        let stdout = '';
        app.stdout.on('data', (data) => {
            stdout = data;
        });
        app.on('close', (code) => {
            if (code !== 0 && !stdout.includes('nothing to commit')) {
                err = new Error(
                    `${cmd} ${args} \n ${stdout} \n Invalid status code: ${code}`
                );
                err.code = code;
                return reject(err);
            }
            return resolve(code);
        });
        app.on('error', reject);
    });

const commitFile = async () => {
    await execCmd('git', [
        'config',
        '--global',
        'user.email',
        'profile-summary-cards-bot@example.com',
    ]);
    await execCmd('git', [
        'config',
        '--global',
        'user.name',
        'profile-summary-cards[bot]',
    ]);
    await execCmd('git', ['add', outputPath]);
    await execCmd('git', ['commit', '-m', 'Generate profile summary cards']);
    await execCmd('git', ['push']);
};

// main
const main = async () => {
    core.info(`Start...`);
    let username = process.argv[2];
    let isInGithubAction = false;

    if (process.argv.length == 2) {
        try {
            username = core.getInput('USERNAME');
            isInGithubAction = true;
        } catch (error) {
            throw Error(error.message);
        }
    }
    try {
        // remove old output
        if (isInGithubAction) {
            core.info(`Remove old cards...`);
            await execCmd('sudo', ['rm', '-rf', outputPath]);
        }
        try {
            core.info(`Creating ProfileDetailsCard...`);
            await createProfileDetailsCard(username);
        } catch (error) {
            core.error(
                `Error when creating ProfileDetailsCard \n${error.stack}`
            );
        }
        try {
            core.info(`Creating ReposPerLanguageCard...`);
            await createReposPerLanguageCard(username);
        } catch (error) {
            core.error(
                `Error when creating ReposPerLanguageCard \n${error.stack}`
            );
        }
        try {
            core.info(`Creating CommitsPerLanguageCard...`);
            await createCommitsPerLanguageCard(username);
        } catch (error) {
            core.error(
                `Error when creating CommitsPerLanguageCard \n${error.stack}`
            );
        }
        try {
            core.info(`Creating StatsCard...`);
            await createStatsCard(username);
        } catch (error) {
            core.error(`Error when creating StatsCard \n${error.stack}`);
        }
        try {
            core.info(`Creating ProductiveTimeCard...`);
            await createProductiveTimeCard(username);
        } catch (error) {
            core.error(
                `Error when creating ProductiveTimeCard \n${error.stack}`
            );
        }
        try {
            core.info(`Creating preview markdown...`);
            generatePreviewMarkdown(isInGithubAction);
        } catch (error) {
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
    } catch (error) {
        core.error(error);
        core.setFailed(error.message);
    }
};

main();
