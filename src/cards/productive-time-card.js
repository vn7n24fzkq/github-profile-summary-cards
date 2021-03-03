const Themes = require("../const/theme");
const getProfileDetails = require("../github-api/profile-details");
const getProductiveTime = require("../github-api/productive-time");
const productiveTimeCard = require("../templates/productive-time-card");
const { writeSVG } = require("../utils/file-writer");

const createProductiveTimeCard = async function (username) {
  let userId = (await getProfileDetails(username))["id"];
  let until = new Date(); // get data until now
  let productiveTime = await getProductiveTime(
    username,
    userId,
    until.toISOString()
  );
  //process productiveTime
  let chartData = new Array(24);
  chartData.fill(0);
  for (let time of productiveTime) {
    let hour = new Date(time).getUTCHours(); //we use UTC+0 here
    chartData[hour] += 1;
  }

  for (let themeName in Themes) {
    let theme = Themes[themeName];
    let svgString = productiveTimeCard(chartData, theme);
    //output to folder, use 4- prefix for sort in preview
    writeSVG(themeName, "4-productive-time", svgString);
  }
};

module.exports = createProductiveTimeCard;
