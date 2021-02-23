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
  fs.writeFileSync(`${targetFolder}${filename}.svg`, svgString, function (
    err,
    result
  ) {
    if (err) throw err;
  });
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
  readmeContent += `
# Preview Cards

Here are all cards with themes.
| :warning: | If your workflow does not generate all cards in output folder, then you need to use [Personal access token](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) instead of GITHUB_TOKEN in workflow. |
| :-------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

[Personal token need those permission](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Personal-access-token-permissions)

`;

  for (let themeName in Themes) {
    readmeContent += `
### ${themeName}

`;
    for (let file of getAllFileInFolder(targetFolder + themeName)) {
      readmeContent += `
\`\`\`
[![](${urlPrefix}/${themeName}/${file})](https://github.com/vn7n24fzkq/github-profile-summary-cards)
\`\`\`
![](${urlPrefix}/${themeName}/${file})

`;
    }
  }

  fs.writeFileSync(`${targetFolder}README.md`, readmeContent, function (
    err,
    result
  ) {
    if (err) throw err;
  });
};

module.exports = {
  writeSVG,
  outputPath,
  generatePreviewMarkdown,
};
