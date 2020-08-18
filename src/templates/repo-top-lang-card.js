const Theme = require("../const/theme");
const getRepoLanguage = require("../utils/github-api/langs");
const writeSVG = require("../utils/svg-writer");
const Card = require("./card");
const d3 = require("d3");

function logMapElements(value, key, map) {}

function createLanguageNode() {}

const createRepoLanguageCard = async function (username) {
  let langMap = await getRepoLanguage(username);
  let data = [];

  //make a pie data
  for (let [key, value] of langMap) {
    data.push({
      name: key,
      value: value.count,
      color: value.color,
    });
  }
  data.sort(function (a, b) {
    return b.value - a.value;
  });
  data = data.slice(0, 5);

  for (let key in Theme) {
    let value = Theme[key];
    let svgString = createCardByTheme(data, value);
    //output to folder
    writeSVG("repo-per-language", key, svgString);
  }
};

function createCardByTheme(languageData, theme) {
  let pie = d3.pie().value(function (d) {
    return d.value;
  });
  let pieData = pie(languageData);

  let card = new Card("Repos per Language", 350, 200, theme);

  let radius = Math.min(card.width, card.height) / 2.5;

  let arc = d3
    .arc()
    .outerRadius(radius - 10)
    .innerRadius(radius / 2);

  let svg = card.getSVG();

  //draw language node

  const legend = svg
    .append("g")
    .attr(
      "transform",
      `translate(${card.height / 4},${card.height / 2 - radius})`
    );
  let labelHeight = 14;
  legend
    .selectAll(null)
    .data(pieData)
    .enter()
    .append("rect")
    .attr(
      "y",
      (d) => labelHeight * d.index * 1.8 + card.height / 2 - radius - 12
    ) //rect y-coordinate need fix, decrease 15 can fix it but I don't know why.
    .attr("width", labelHeight)
    .attr("height", labelHeight)
    .attr("fill", (pieData) => pieData.data.color)
    .attr("stroke", "white")
    .style("stroke-width", "1px");

  //set langu text
  legend
    .selectAll(null)
    .data(pieData)
    .enter()
    .append("text")
    .text((d) => {
      return d.data.name;
    })
    .attr("x", labelHeight * 1.2)
    .attr("y", (d) => labelHeight * d.index * 1.8 + card.height / 2 - radius)
    .style("fill", theme.text_color)
    .style("font-family", "'Lucida Sans Unicode', 'Lucida Grande', sans-serif")
    .style("font-size", `${labelHeight}px`);

  //draw pie chart
  let g = svg
    .append("g")
    .attr(
      "transform",
      `translate( ${card.width - radius - 20}, ${card.height / 2 - 10} )`
    )
    .selectAll(".arc")
    .data(pieData)
    .enter()
    .append("g")
    .attr("class", "arc");

  g.append("path")
    .attr("d", arc)
    .style("fill", function (pieData) {
      return pieData.data.color;
    })
    .attr("stroke", "white")
    .style("stroke-width", "3px");
  return card.toString();
}

module.exports = createRepoLanguageCard;
