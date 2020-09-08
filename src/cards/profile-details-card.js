const Themes = require("../const/theme");
const Icons = require("../const/icon");
const NumAbbr = require("number-abbreviate");
const moment = require("moment");
const getProfileDetails = require("../github-api/profile-details");
const getContributionByYear = require("../github-api/contributions-by-year");
const createDetailCard = require("../templates/profile-details-card");
const { writeSVG, outputPath } = require("../utils/file-writer");

const createProfileDetailsCard = async function (username) {
  let userDetails = await getProfileDetails(username);
  let totalContributions = 0;
  for (let year of userDetails.contributionYears) {
    totalContributions += (await getContributionByYear(username, year))
      .totalContributions;
  }
  let numAbbr = new NumAbbr();
  let details = [
    {
      index: 0,
      icon: Icons.GITHUB,
      name: "Contributions",
      value: `${numAbbr.abbreviate(
        totalContributions,
        2
      )} contributions on github`,
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
    {
      index: 2,
      icon: Icons.CLOCK,
      name: "JoinedAt",
      value: `Joined GitHub ${moment(userDetails["joinedAt"]).fromNow()}`,
    },
  ];

  // hard code here, cuz I'm lazy
  if (userDetails["email"]) {
    details.push({
      index: 3,
      icon: Icons.EMAIL,
      name: "Email",
      value: userDetails["email"],
    });
  } else if (userDetails["company"]) {
    details.push({
      index: 3,
      icon: Icons.COMPANY,
      name: "Company",
      value: userDetails["company"],
    });
  } else if (userDetails["location"]) {
    details.push({
      index: 3,
      icon: Icons.LOCATION,
      name: "Location",
      value: userDetails["location"],
    });
  }

  let contributionsData = userDetails.contributions;

  for (let themeName in Themes) {
    let theme = Themes[themeName];
    let title =
      userDetails.name == null
        ? `${username}`
        : `${username} (${userDetails.name})`;
    let svgString = createDetailCard(
      `${title}`,
      details,
      contributionsData,
      theme
    );
    //output to folder, use 0- prefix for sort in preview
    writeSVG(themeName, "0-profile-details", svgString);
  }
};

module.exports = createProfileDetailsCard;
