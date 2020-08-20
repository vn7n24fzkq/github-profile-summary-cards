const Theme = require("../const/theme");
const getRepoLanguage = require("../github-api/profile-details");
const writeSVG = require("../utils/svg-writer");
const Card = require("./card");
const d3 = require("d3");


function createDetailCard(userDetails, theme) {

  let card = new Card(`${userDetails.name}`, 450, 200, theme);
  let svg = card.getSVG();

  //draw language node

  const legend = svg
    .append("g")
    .attr(
      "transform",
      `translate(${card.height},${card.height})`
    );
  let labelHeight = 14;
  legend
    .selectAll(null)
    .data(userDetails)
    .enter()
    .append("rect")
    .attr(
      "y",
      (d) => labelHeight * d.index * 1.8 + card.height / 2 - 12
    ) //rect y-coordinate need fix, decrease 12 can fix it but I don't know why.
    .attr("width", labelHeight)
    .attr("height", labelHeight)
    .attr("fill", theme.text_color)
    .attr("stroke", "white")
    .style("stroke-width", "1px");

  //set langu text
  legend
    .selectAll(null)
    .data(userDetails)
    .enter()
    .append("text")
    .text((d) => {
      return d.name;
    })
    .attr("x", labelHeight * 1.2)
    .attr("y", (d) => labelHeight * d.index * 1.8 + card.height / 2 )
    .style("fill", theme.text_color)
    .style("font-family", "'Lucida Sans Unicode', 'Lucida Grande', sans-serif")
    .style("font-size", `${labelHeight}px`);

  return card.toString();
}

module.exports = createDetailCard;
