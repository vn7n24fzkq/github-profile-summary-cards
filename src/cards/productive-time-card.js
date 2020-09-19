const Themes = require("../const/theme");
const Icons = require("../const/icon");
const NumAbbr = require("number-abbreviate");
const getProfileDetails = require("../github-api/profile-details");
const getContributionByYear = require("../github-api/contributions-by-year");
const statsCard = require("../templates/productive-time-card");
const { writeSVG, outputPath } = require("../utils/file-writer");

const createProductiveTimeCard = async function (username) {
  for (let themeName in Themes) {
    let theme = Themes[themeName];
    let svgString = statsCard(theme);
    //output to folder, use 3- prefix for sort in preview
    writeSVG(themeName, "4-productive-time", svgString);
  }
};

module.exports = createProductiveTimeCard;
