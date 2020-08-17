const fs = require("fs");
const writeSVG = function (filename, svgString) {
  const folder = "./profile-summary-card-output/";
  fs.mkdir(folder, { recursive: true }, (err) => {
    if (err) throw err;
    fs.writeFileSync(`${folder}${filename}.svg`, svgString, function (
      err,
      result
    ) {
      if (err) console.log("error", err);
    });
  });
};

module.exports = writeSVG;
