import {
    info,
    getInput,
    error as _error,
    warning,
    setFailed,
} from '@actions/core'
import createProfileDetailsCard from './cards/profile-details-card.js'
import createReposPerLanguageCard from './cards/repos-per-language-card.js'
import createCommitsPerLanguageCard from './cards/most-commit-lauguage-card.js'
import createStatsCard from './cards/stats-card.js'
import createProductiveTimeCard from './cards/productive-time-card.js'
import { spawn } from 'child_process'
import { outputPath, generatePreviewMarkdown } from './utils/file-writer.js'
import dotenv from 'dotenv'

dotenv.config()

const execCmd = (cmd, args = []) =>
    new Promise((resolve, reject) => {
        const app = spawn(cmd, args, { stdio: 'pipe' })
        let stdout = ''
        app.stdout.on('data', (data) => {
            stdout = data
        })
        app.on('close', (code) => {
            if (code !== 0 && !stdout.includes('nothing to commit')) {
                err = new Error(
                    `${cmd} ${args} \n ${stdout} \n Invalid status code: ${code}`
                )
                err.code = code
                return reject(err)
            }
            return resolve(code)
        })
        app.on('error', reject)
    })

const commitFile = async () => {
    await execCmd('git', [
        'config',
        '--global',
        'user.email',
        'profile-summary-cards-bot@example.com',
    ])
    await execCmd('git', [
        'config',
        '--global',
        'user.name',
        'profile-summary-cards[bot]',
    ])
    await execCmd('git', ['add', outputPath])
    await execCmd('git', ['commit', '-m', 'Generate profile summary cards'])
    await execCmd('git', ['push'])
}

// main
const main = async () => {
    info(`Start...`)
    let username = process.argv[2]
    let isInGithubAction = false

    if (process.argv.length == 2) {
        try {
            username = getInput('USERNAME')
            isInGithubAction = true
        } catch (error) {
            throw Error(error.message)
        }
    }
    try {
        // remove old output
        if (isInGithubAction) {
            info(`Remove old cards...`)
            await execCmd('sudo', ['rm', '-rf', outputPath])
        }
        try {
            info(`Creating ProfileDetailsCard...`)
            await createProfileDetailsCard(username)
        } catch (error) {
            _error(`Error when creating ProfileDetailsCard \n${error.stack}`)
        }
        try {
            info(`Creating ReposPerLanguageCard...`)
            await createReposPerLanguageCard(username)
        } catch (error) {
            _error(`Error when creating ReposPerLanguageCard \n${error.stack}`)
        }
        try {
            info(`Creating CommitsPerLanguageCard...`)
            await createCommitsPerLanguageCard(username)
        } catch (error) {
            _error(
                `Error when creating CommitsPerLanguageCard \n${error.stack}`
            )
        }
        try {
            info(`Creating StatsCard...`)
            await createStatsCard(username)
        } catch (error) {
            _error(`Error when creating StatsCard \n${error.stack}`)
        }
        try {
            info(`Creating ProductiveTimeCard...`)
            await createProductiveTimeCard(username)
        } catch (error) {
            _error(`Error when creating ProductiveTimeCard \n${error.stack}`)
        }
        try {
            info(`Creating preview markdown...`)
            await generatePreviewMarkdown(isInGithubAction)
        } catch (error) {
            _error(`Error when creating preview markdown \n${error.stack}`)
        }
        if (isInGithubAction) {
            info(`Commit file...`)
            let retry = 0
            const maxRetry = 3
            while (retry < maxRetry) {
                retry += 1
                try {
                    await commitFile()
                } catch (error) {
                    if (retry == maxRetry) {
                        throw error
                    }
                    warning(`Commit failed. Retry...`)
                }
            }
        }
    } catch (error) {
        _error(error)
        setFailed(error.message)
    }
}

main()
