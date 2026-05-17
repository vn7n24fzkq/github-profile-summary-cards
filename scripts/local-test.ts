// Local visual test harness — generates summary cards for a given GitHub login
// using your local GITHUB_TOKEN. Drives the same code path that runs in CI and
// on Vercel, so the SVGs it writes match what production would produce.
//
// Usage:
//   1. Put GITHUB_TOKEN=ghp_xxx in a .env file at the repo root.
//   2. npm run test:local -- <login> [utcOffset] [exclude]
//      e.g. npm run test:local -- vn7n24fzkq 8
//           npm run test:local -- microsoft 0 java,jupyter%20notebook
//
// Output:
//   profile-summary-card-output/<theme>/0-profile-details.svg
//                                       1-repos-per-language.svg
//                                       2-most-commit-language.svg
//                                       3-stats.svg
//                                       4-productive-time.svg          (User logins only)
//                                       4-productive-time-unsupported.svg (Organization logins)

import 'dotenv/config';
import {writeFileSync} from 'fs';
import {createProfileDetailsCard} from '../src/cards/profile-details-card';
import {createReposPerLanguageCard} from '../src/cards/repos-per-language-card';
import {createCommitsPerLanguageCard} from '../src/cards/most-commit-language-card';
import {createStatsCard} from '../src/cards/stats-card';
import {createProductiveTimeCard} from '../src/cards/productive-time-card';
import {createOrganizationProfileDetailsCard} from '../src/cards/organization-profile-details-card';
import {createOrganizationReposPerLanguageCard} from '../src/cards/organization-repos-per-language-card';
import {createOrganizationCommitsPerLanguageCard} from '../src/cards/organization-most-commit-language-card';
import {createOrganizationStatsCard} from '../src/cards/organization-stats-card';
import {getOwnerType} from '../src/github-api/owner-type';
import {ThemeMap} from '../src/const/theme';
import {OUTPUT_PATH, generatePreviewMarkdown} from '../src/utils/file-writer';
import {translateLanguage} from '../src/utils/translator';
import {getErrorMsgCard} from '../api/utils/error-card';

const ORG_PRODUCTIVE_TIME_MSG =
    'The Productive Time card is not available for organization accounts. This card relies on per-user contribution data that GitHub does not expose at the organization level.';

const writeOrgProductiveTimePlaceholder = () => {
    for (const themeName of ThemeMap.keys()) {
        const svg = getErrorMsgCard(ORG_PRODUCTIVE_TIME_MSG, themeName);
        writeFileSync(`${OUTPUT_PATH}${themeName}/4-productive-time-unsupported.svg`, svg);
    }
};

const main = async () => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('GITHUB_TOKEN is not set. Add it to a .env file at the repo root or export it before running.');
        process.exit(1);
    }

    const login = process.argv[2] ?? 'vn7n24fzkq';
    const utcOffset = Number(process.argv[3] ?? '0');
    const exclude: string[] = [];
    if (process.argv[4]) {
        for (const val of process.argv[4].split(',')) {
            exclude.push(translateLanguage(val).toLowerCase());
        }
    }

    console.info(`Local test for login: ${login}`);
    console.info(`UTC offset: ${utcOffset}`);
    console.info(`Excluded languages: ${exclude.length === 0 ? '(none)' : exclude.join(', ')}`);

    const ownerType = await getOwnerType(login, token);
    console.info(`Detected owner type: ${ownerType}`);

    if (ownerType === 'Organization') {
        await createOrganizationProfileDetailsCard(login, token);
        await createOrganizationReposPerLanguageCard(login, exclude, token);
        await createOrganizationCommitsPerLanguageCard(login, exclude, token);
        await createOrganizationStatsCard(login, token);
        writeOrgProductiveTimePlaceholder();
        console.info(
            'Skipped ProductiveTimeCard. Wrote 4-productive-time-unsupported.svg per theme so you can see the error card the Vercel route would return.'
        );
    } else {
        await createProfileDetailsCard(login, token);
        await createReposPerLanguageCard(login, exclude, token);
        await createCommitsPerLanguageCard(login, exclude, token);
        await createStatsCard(login, token);
        await createProductiveTimeCard(login, utcOffset, token);
    }

    generatePreviewMarkdown(false, ownerType);

    console.info(
        `Done. Open profile-summary-card-output/default/README.md to preview every card in the default theme.`
    );
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
