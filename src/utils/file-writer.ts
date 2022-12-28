import * as core from '@actions/core';
import {mkdirSync, writeFileSync, readdirSync} from 'fs';
import {ThemeMap} from '../const/theme';

export const OUTPUT_PATH = './profile-summary-card-output/';
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;

// If neither a branch or tag is available for the event type, the variable will not exist. https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables
const GITHUB_BRANCH =
    process.env.GITHUB_REF == undefined
        ? core.getInput('BRANCH_NAME', {required: false})
        : process.env.GITHUB_REF.split('/').pop();

export const writeSVG = function (folder: string, filename: string, svgString: string) {
    const targetFolder = `${OUTPUT_PATH}${folder}/`;
    mkdirSync(targetFolder, {recursive: true});
    writeFileSync(`${targetFolder}${filename}.svg`, svgString);
};

function getAllFileInFolder(folder: string): string[] {
    const files: string[] = [];
    readdirSync(folder).forEach(file => {
        files.push(file);
    });
    return files;
}

export const generatePreviewMarkdown = function (isInGithubAction: boolean) {
    const targetFolder = `${OUTPUT_PATH}`;
    let readmeContent = '';
    const urlPrefix = isInGithubAction
        ? `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_BRANCH}/profile-summary-card-output`
        : `.`;

    // First, we generate preview readme for each theme
    for (const themeName of ThemeMap.keys()) {
        generateThemePreviewReadme(urlPrefix, themeName);
    }
    readmeContent += `
# Theme Preview

Here are all cards with themes.
| :bell: | If only show Top Languages card here, then you maybe forgot to use [Personal access token](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) instead of GITHUB_TOKEN in workflow. |
| :-------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

`;

    for (const themeName of ThemeMap.keys()) {
        readmeContent += `## [${themeName}](./${themeName}/README.md)`;
        readmeContent += getThemeMarkdown(`${urlPrefix}/${themeName}`);
    }

    writeFileSync(`${targetFolder}README.md`, readmeContent);
};

function generateThemePreviewReadme(urlPrefix: string, themeName: string) {
    let themePreviewMarkdown = '';
    themePreviewMarkdown += `## ${themeName}`;
    themePreviewMarkdown += `\n`;
    themePreviewMarkdown += getThemeMarkdown('.');
    themePreviewMarkdown += '### Now you can add this to your markdown';
    themePreviewMarkdown += `
\`\`\`
${getThemeMarkdown(`${urlPrefix}/${themeName}`)}
\`\`\`
`;
    themePreviewMarkdown += `\n`;
    themePreviewMarkdown += `### Each card usage`;
    for (const file of getAllFileInFolder(OUTPUT_PATH + themeName)) {
        if (!file.endsWith('svg')) continue;
        themePreviewMarkdown += `
---

![](./${file})

\`\`\`
![](${urlPrefix}/${themeName}/${file})
\`\`\`

    `;
        themePreviewMarkdown += `\n`;
    }
    writeFileSync(`${OUTPUT_PATH}${themeName}/README.md`, themePreviewMarkdown);
}

function getThemeMarkdown(urlPrefix: string): string {
    let result = '';
    result += `
[![](${urlPrefix}/0-profile-details.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards)
[![](${urlPrefix}/1-repos-per-language.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards) [![](${urlPrefix}/2-most-commit-language.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards)
[![](${urlPrefix}/3-stats.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards) [![](${urlPrefix}/4-productive-time.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards)
`;
    return result;
}
