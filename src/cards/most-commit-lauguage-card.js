const Themes = require("../const/theme");
const Icons = require("../const/icon");
const getCommitLanguage = require("../github-api/commits-per-lauguage");
const createDonutChartCard = require("../templates/donut-chart-card");
const getProfileDetails = require("../github-api/profile-details");
const { writeSVG, outputPath } = require("../utils/file-writer");

const createCommitsPerLanguageCard = async function (username) {
  let userDetails = await getProfileDetails(username);
  let langMap = new Map();
  for (let year of userDetails.contributionYears) {
    let map = await getCommitLanguage(username, year);
    for (let [key, value] of map) {
      if (langMap.has(key)) {
        let lang = langMap.get(key);
        lang.count += value.count;
      } else {
        langMap.set(key, {
          count: value.count,
          color: value.color == null ? "#586e75" : value.color,
        });
      }
    }
  }
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
  otherData = langData.slice(5); //get remaining
  langData = langData.slice(0, 5); //get top languages

/*
  otherValue = otherData.reduce(function(acc, entry) {
    return acc + entry.value;
  }, 0);

  if (otherValue > 0) {
    langData.push({
      name: 'Others',
      value: otherValue,
      color: '#586e75'
    });
  }

  console.log(langData);
  console.log(otherData);
  */

  for (let themeName in Themes) {
    let theme = Themes[themeName];
    let svgString = createDonutChartCard(
      "Most Commit Language",
      langData,
      theme
    );
    //output to folder, use 2- prefix for sort in preview
    writeSVG(themeName, "2-most-commit-language", svgString);
  }
};

module.exports = createCommitsPerLanguageCard;
