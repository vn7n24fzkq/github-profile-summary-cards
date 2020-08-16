const Theme = require("../const/theme");
const getRepoLanguage = require("../utils/github-api/langs");
const writeSVG = require("../utils/svg-writer");
const Card = require("./card");

function logMapElements(value, key, map) {}

function createLanguageNode() {}

const createRepoLanguageCard = async function (username) {
  let langMap = await getRepoLanguage(username);
  for (let [key, value] of langMap) {
    console.log(key + " = " + value.count);
  }

  // Draw a line
  let card= new Card();
  console.log(card.toString());
  let circle = card.getSVG()
    .append("line")
    .attr("x1", 5)
    .attr("y1", 5)
    .attr("x2", 500)
    .attr("y2", 500)
    .attr("stroke-width", 2)
    .attr("stroke", "black");

  // Output the result to console
  console.log(card.toString());
};

module.exports = createRepoLanguageCard;
