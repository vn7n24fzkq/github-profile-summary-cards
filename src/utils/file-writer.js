const mkdirSync = require('fs').mkdirSync;
const writeFileSync = require('fs').writeFileSync;
const readdirSync = require('fs').readdirSync;
const Themes = require('../const/theme.js');
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;

const outputPath = './profile-summary-card-output/';

// If neither a branch or tag is available for the event type, the variable will not exist. https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables
const GITHUB_BRANCH =
    process.env.GITHUB_REF == undefined
        ? 'main'
        : process.env.GITHUB_REF.split('/').pop();

const writeSVG = function (folder, filename, svgString) {
    const targetFolder = `${outputPath}${folder}/`;
    mkdirSync(targetFolder, { recursive: true });
    writeFileSync(
        `${targetFolder}${filename}.svg`,
        svgString,
        function (err, result) {
            if (err) throw err;
        }
    );
};

function getAllFileInFolder(folder) {
    const files = [];
    readdirSync(folder).forEach((file) => {
        files.push(file);
    });
    return files;
}

const generatePreviewMarkdown = function (isInGithubAction) {
    const targetFolder = `${outputPath}`;
    let readmeContent = '';
    const urlPrefix = isInGithubAction
        ? `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_BRANCH}/profile-summary-card-output`
        : `.`;

    // First, we generate preview readme for each theme

    for (const themeName of Themes.keys()) {
        generateThemePreviewReadme(urlPrefix, themeName);
    }
    readmeContent += `
# Theme Preview

Here are all cards with themes.
| :bell: | If only show Top Languages card here, then you maybe forgot to use [Personal access token](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) instead of GITHUB_TOKEN in workflow. |
| :-------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

`;

    for (const themeName of Themes.keys()) {
        readmeContent += `## [${themeName}](./${themeName}/README.md)`;
        readmeContent += getThemeMarkdown(
            `${urlPrefix}/${themeName}`,
            themeName
        );
    }

    writeFileSync(
        `${targetFolder}README.md`,
        readmeContent,
        function (err, result) {
            if (err) throw err;
        }
    );
};

function generateThemePreviewReadme(urlPrefix, themeName) {
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
    for (const file of getAllFileInFolder(outputPath + themeName)) {
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
    writeFileSync(
        `${outputPath}${themeName}/README.md`,
        themePreviewMarkdown,
        function (err, result) {
            if (err) throw err;
        }
    );
}

function getThemeMarkdown(urlPrefix) {
    let result = '';
    result += `
[![](${urlPrefix}/0-profile-details.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards)
[![](${urlPrefix}/1-repos-per-language.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards) [![](${urlPrefix}/2-most-commit-language.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards)
[![](${urlPrefix}/3-stats.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards) [![](${urlPrefix}/4-productive-time.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards)
`;
    return result;
}

module.exports = {
    writeSVG,
    outputPath,
    generatePreviewMarkdown,
};
