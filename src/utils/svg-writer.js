const fs = require("fs");
const rootPath = "./profile-summary-card-output/";
const writeSVG = function (folder,filename, svgString) {
  const targetFolder = `${rootPath}${folder}/`
  fs.mkdir(targetFolder, { recursive: true }, (err) => {
    if (err) throw err;
    fs.writeFileSync(`${targetFolder}${filename}.svg`, svgString, function (
      err,
      result
    ) {
      if (err) console.log("error", err);
    });
  });
};

module.exports = writeSVG;
