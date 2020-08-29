const fs = require("fs");
const outputPath = "./profile-summary-card-output/";
const writeSVG = function (folder,filename, svgString) {
  const targetFolder = `${outputPath}${folder}/`
  fs.mkdirSync(targetFolder, { recursive: true });
  fs.writeFileSync(`${targetFolder}${filename}.svg`, svgString, function (
    err,
    result
  ) {
    if (err) throw (err);
  });
};

module.exports = {
    writeSVG,
    outputPath};
