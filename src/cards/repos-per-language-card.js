const Themes = require("../const/theme");
const Icons = require("../const/icon");
const getRepoLanguage = require("../github-api/repos-per-language");
const createDonutChartCard = require("../templates/donut-chart-card");
const { writeSVG, outputPath } = require("../utils/file-writer");

const createReposPerLanguageCard = async function (username) {
  let langMap = await getRepoLanguage(username);
  let langData = [];

  //make a pie data
  for (let [key, value] of langMap) {
    langData.push({
      name: key,
      value: value.count,
      color: value.color,
    });
  }
  langData.sort(function (a, b) {
    return b.value - a.value;
  });
  langData = langData.slice(0, 5); //get top 5

  for (let themeName in Themes) {
    let theme = Themes[themeName];
    let svgString = createDonutChartCard(
      "Top Languages by Repo",
      langData,
      theme
    );
    //output to folder, use 1- prefix for sort in preview
    writeSVG(themeName, "1-repos-per-language", svgString);
  }
};

module.exports = createReposPerLanguageCard;
