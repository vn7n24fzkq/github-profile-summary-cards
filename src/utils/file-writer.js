const fs = require("fs");
const outputPath = "./profile-summary-card-output/";
const Themes = require("../const/theme");
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;

// If neither a branch or tag is available for the event type, the variable will not exist. https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables
const GITHUB_BRANCH =
  process.env.GITHUB_REF == undefined
    ? "main"
    : process.env.GITHUB_REF.split("/").pop();

const writeSVG = function (folder, filename, svgString) {
  const targetFolder = `${outputPath}${folder}/`;
  fs.mkdirSync(targetFolder, { recursive: true });
  fs.writeFileSync(
    `${targetFolder}${filename}.svg`,
    svgString,
    function (err, result) {
      if (err) throw err;
    }
  );
};

function getAllFileInFolder(folder) {
  let files = [];
  fs.readdirSync(folder).forEach((file) => {
    files.push(file);
  });
  return files;
}

const generatePreviewMarkdown = function (isInGithubAction) {
  let targetFolder = `${outputPath}`;
  let readmeContent = "";
  let urlPrefix = isInGithubAction
    ? `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_BRANCH}/profile-summary-card-output`
    : `.`;

  // First, we generate preview readme for each theme

  for (let themeName in Themes) {
    generateThemePreviewReadme(urlPrefix, themeName);
  }
  readmeContent += `
# Theme Preview

Here are all cards with themes.
| :bell: | If only show Top Languages card here, then you maybe forgot to use [Personal access token](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) instead of GITHUB_TOKEN in workflow. |
| :-------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

`;

  for (let themeName in Themes) {
    readmeContent += `## [${themeName}](./${themeName}/README.md)`;
    readmeContent += getThemeMarkdown(`${urlPrefix}/${themeName}`, themeName);
  }

  fs.writeFileSync(
    `${targetFolder}README.md`,
    readmeContent,
    function (err, result) {
      if (err) throw err;
    }
  );
};

function generateThemePreviewReadme(urlPrefix, themeName) {
  let themePreviewMarkdown = "";
  themePreviewMarkdown += `## ${themeName}`;
  themePreviewMarkdown += `\n`;
  themePreviewMarkdown += getThemeMarkdown(".");
  themePreviewMarkdown += "### Now you can add this to your markdown";
  themePreviewMarkdown += `
\`\`\`
${getThemeMarkdown(urlPrefix)}
\`\`\`
`;
  themePreviewMarkdown += `\n`;
  themePreviewMarkdown += `### Each card usage`;
  for (let file of getAllFileInFolder(outputPath + themeName)) {
    if (!file.endsWith("svg")) continue;
    themePreviewMarkdown += `
---

![](./${file})

\`\`\`
![](${urlPrefix}/${themeName}/${file})
\`\`\`

    `;
    themePreviewMarkdown += `\n`;
  }
  fs.writeFileSync(
    `${outputPath}${themeName}/README.md`,
    themePreviewMarkdown,
    function (err, result) {
      if (err) throw err;
    }
  );
}

function getThemeMarkdown(urlPrefix) {
  let result = "";
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
