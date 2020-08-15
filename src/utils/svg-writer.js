const fs = require("fs");
module.exports.save = function (filename, svgString) {
  const folder = "/tmp/github-svg/";
  fs.mkdir(folder, { recursive: true }, (err) => {
    if (err) throw err;
  });
  fs.writeFileSync(`${folder}${filename}.svg`, svgString, function (
    err,
    result
  ) {
    if (err) console.log("error", err);
  });
};
