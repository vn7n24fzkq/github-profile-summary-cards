#!/ur/bin/env node

const Themes = require("./const/theme");
const Icons = require("./const/icon");
const getRepoLanguage = require("./github-api/langs");
const getProfileDetails = require("./github-api/profile-details");
const writeSVG = require("./utils/svg-writer");
const createDonutChartCard = require("./templates/donut-chart-card");
const createDetailCard = require("./templates/profile-details-card");
const NumAbbr = require("number-abbreviate");
const moment = require("moment");

const createProfileDetailsCard = async function (username) {
  let userDetails = await getProfileDetails(username);
  let numAbbr = new NumAbbr();
  let details = [
    {
      index: 0,
      icon: Icons.GITHUB,
      name: "Contributions",
      value: `${numAbbr.abbreviate(
        userDetails["totalContributions"],
        2
      )} contributions in last year`,
    },
    {
      index: 1,
      icon: Icons.REPOS,
      name: "Public Repos",
      value: `${numAbbr.abbreviate(
        userDetails["totalPublicRepos"],
        2
      )} public repos`,
    },
    { index: 2, icon: Icons.EMAIL, name: "Email", value: userDetails["email"] },
    {
      index: 3,
      icon: Icons.CLOCK,
      name: "JoinedAt",
      value: `Joined GitHub ${moment(userDetails["joinedAt"]).fromNow()}`,
    },
  ];

  let contributionsData = userDetails.contributions;

  for (let themeName in Themes) {
    let theme = Themes[themeName];
    let svgString = createDetailCard(
      `${username} (${userDetails.name})`,
      details,
      contributionsData,
      theme
    );
    //output to folder
    writeSVG(themeName, "profile-details", svgString);
  }
};

const createRepoPerLanguageCard = async function (username) {
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
  langData = langData.slice(0, 5);

  for (let themeName in Themes) {
    let theme = Themes[themeName];
    let svgString = createDonutChartCard(
      "Repos per Language (top 5)",
      langData,
      theme
    );
    //output to folder
    writeSVG(themeName, "repo-per-language", svgString);
  }
};

var username = process.argv[2];

if (process.argv.length == 2) {
  throw Error(res.data.errors[0].message || "Github api fail");
}

createProfileDetailsCard(username);
createRepoPerLanguageCard(username);
