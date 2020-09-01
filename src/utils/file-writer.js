const fs = require("fs");
const outputPath = "./profile-summary-card-output/";
const Themes = require("../const/theme");
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const GITHUB_REF = process.env.GITHUB_REF;

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
    console.log(file);
  });
  return files;
}

const generatePreviewMarkdown = function (pro) {
  let targetFolder = `${outputPath}`;
  let readmeContent = "";
  readmeContent += 
`
# Preview Cards

Here are all cards with themes.

`;

  for (let themeName in Themes) {
    readmeContent += 
`
### ${themeName}

`;
    for (let file of getAllFileInFolder(targetFolder + themeName)) {
      readmeContent += `
\`\`\`
profile-summary-card-output/solarized/repo-per-language.svg
![](https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/profile-summary-card-output/${themeName}/${file})

\`\`\`
![](https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/profile-summary-card-output/${themeName}/${file})

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
