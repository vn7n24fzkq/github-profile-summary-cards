#!/ur/bin/env node

const core = require("@actions/core");
const { spawn } = require("child_process");
const Themes = require("./const/theme");
const Icons = require("./const/icon");
const getRepoLanguage = require("./github-api/repos-per-language");
const getProfileDetails = require("./github-api/profile-details");
const { writeSVG, outputPath } = require("./utils/svg-writer");
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
    {
      index: 2,
      icon: Icons.CLOCK,
      name: "JoinedAt",
      value: `Joined GitHub ${moment(userDetails["joinedAt"]).fromNow()}`,
    },
  ];

  // hard code here, cuz I'm lazy
  if (userDetails["email"] != "") {
    details.push({
      index: 3,
      icon: Icons.EMAIL,
      name: "Email",
      value: userDetails["email"],
    });
  } else if (userDetails["company"] != "") {
    details.push({
      index: 3,
      icon: Icons.COMPANY,
      name: "Company",
      value: userDetails["company"],
    });
  } else if (userDetails["location"] != "") {
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

const execCmd = (cmd, args = []) =>
  new Promise((resolve, reject) => {
    const app = spawn(cmd, args, { stdio: "pipe" });
    let stdout = "";
    app.stdout.on("data", (data) => {
      stdout = data;
    });
    app.on("close", (code) => {
      if (code !== 0 && !stdout.includes("nothing to commit")) {
        err = new Error(
          `${cmd} ${args} \n ${stdout} \n Invalid status code: ${code}`
        );
        err.code = code;
        return reject(err);
      }
      return resolve(code);
    });
    app.on("error", reject);
  });

const commitFile = async () => {
  await execCmd("git", [
    "config",
    "--global",
    "user.email",
    "profile-summary-cards-bot@example.com",
  ]);
  await execCmd("git", [
    "config",
    "--global",
    "user.name",
    "profile-summary-cards[bot]",
  ]);
  await execCmd("git", ["add", outputPath]);
  await execCmd("git", ["commit", "-m", "Generate profile summary cards"]);
  await execCmd("git", ["push"]);
};

// main
const main = async () => {
  let username = process.argv[2];
  let isInGithubAction = false;

  if (process.argv.length == 2) {
    try {
      username = core.getInput("USERNAME");
      isInGithubAction = true;
    } catch (error) {
      throw Error(error.message);
    }
  }
  try {
    //remove old output
    if (isInGithubAction) {
      await execCmd("sudo", ["rm", "-rf", outputPath]);
    }
    try {
      core.info(`Createing ProfileDetailsCard...`);
      await createProfileDetailsCard(username);
    } catch (error) {
      core.error(`Error when creating ProfileDetailsCard\n${error}`);
    }
    try {
      core.info(`Createing RepoPerLanguageCard...`);
      await createRepoPerLanguageCard(username);
    } catch (error) {
      core.error(`Error when creating RepoPerLanguageCard\n${error}`);
    }
    if (isInGithubAction) {
      await commitFile();
    }
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
};

main();
