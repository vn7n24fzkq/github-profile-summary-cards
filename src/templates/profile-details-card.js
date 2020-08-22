const theme = require("../const/theme");
const getRepoLanguage = require("../github-api/profile-details");
const writeSVG = require("../utils/svg-writer");
const Card = require("./card");
const d3 = require("d3");


function createDetailCard(title, userDetails, theme) {

  let card = new Card(title, 800, 200, theme);
  let svg = card.getSVG();

  //draw language node

  const panel = svg
    .append("g")
    .attr(
      "transform",
      `translate(30,30)`
    );
  let labelHeight = 14;
  panel
    .selectAll(null)
    .data(userDetails)
    .enter()
    .append("g")
    .attr("transform", (d) => {
        let y = labelHeight * d.index * 2;
        return `translate(0,${y})`;
    }  )
    .attr("width", labelHeight)
    .attr("height", labelHeight)
    .attr("fill", theme.text_color)
    .html((d)=>d.icon);


  //set langu text
  panel
    .selectAll(null)
    .data(userDetails)
    .enter()
    .append("text")
    .text((d) => {
      return d.value;
    })
    .attr("x", labelHeight * 1.5)
    .attr("y", (d) => labelHeight * d.index * 2  +labelHeight)
    .style("fill", theme.text_color)
    .style("font-family", "'Lucida Sans Unicode', 'Lucida Grande', sans-serif")
    .style("font-size", `${labelHeight}px`);

  return card.toString();
}

module.exports = createDetailCard;
