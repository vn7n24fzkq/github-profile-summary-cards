const Card = require("./card");
const d3 = require("d3");

function createDonutChartCard(title, data, theme) {
  let pie = d3.pie().value(function (d) {
    return d.value;
  });
  let pieData = pie(data);
  let card = new Card(title, 320, 200, theme);

  let margin = 10;
  let radius = (Math.min(card.width, card.height) - 2 * margin - card.yPadding)/2;

  let arc = d3
    .arc()
    .outerRadius(radius - 10)
    .innerRadius(radius / 2);

  let svg = card.getSVG();
  //draw language node

  const panel = svg
    .append("g")
    .attr(
      "transform",
      `translate(${card.xPadding+margin},${0})`
    );
  let labelHeight = 14;
  panel
    .selectAll(null)
    .data(pieData)
    .enter()
    .append("rect")
    .attr(
      "y",
      (d) => labelHeight * d.index * 1.8 + card.height / 2 - radius - 12
    ) //rect y-coordinate need fix,so I decrease y, but I don't know why this need fix.
    .attr("width", labelHeight)
    .attr("height", labelHeight)
    .attr("fill", (pieData) => pieData.data.color)
    .attr("stroke", "white")
    .style("stroke-width", "1px");

  //set language text
  panel
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
      `translate( ${card.width - radius - margin - card.xPadding}, ${(card.height - card.yPadding) / 2} )`
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
    .style("stroke-width", "2px");
  return card.toString();
}

module.exports = createDonutChartCard;
