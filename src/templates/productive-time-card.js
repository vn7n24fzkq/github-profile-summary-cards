const Card = require("./card");
const d3 = require("d3");

function createProductiveCard(theme) {
  let card = new Card("", 230, 200, theme, 13, 30);
  let svg = card.getSVG();
  let chartData = d3.range(24).map(function () {
    return Math.round(25 * Math.random());
  });

  let chartWidth = 200;
  let chartHeight = 100;
  var x = d3.scaleBand().range([0, chartWidth]).padding(0.1);

  let majorTitleSize = 22;
  let minorTitleSize = 14;
  let titlePanel = svg
    .append("g")
    .attr("transform", `translate(${card.xPadding},${card.yPadding})`);
  titlePanel
    .append("text")
    .attr("x", 0)
    .attr("y", 0)
    .style("font-size", `${minorTitleSize}px`)
    .style("fill", `${theme.title_color}`)
    .text("I'm most productive during");

  titlePanel
    .append("text")
    .attr("x", 0)
    .attr("y", `${minorTitleSize * 2}`)
    .style("font-size", `${majorTitleSize}px`)
    .style("font-weight", `bold`)
    .style("fill", `${theme.icon_color}`)
    .text("Night-Time");
  x.domain(
    chartData.map(function (d, index) {
      return index;
    })
  );

  let yMax = Math.max.apply(
    Math,
    chartData.map(function (d) {
      return d;
    })
  );

  let y = d3.scaleLinear().range([chartHeight, 0]);
  y.domain([0, yMax]);
  y.nice();

  let chartPanel = svg
    .append("g")
    .attr("color", theme.line_chart_color)
    .attr("transform", `translate(${card.xPadding},${card.yPadding + 40})`);

  var xAxis_woy = d3.axisBottom(x).tickValues([0, 6, 12, 18, 23]);

  //Add the X Axis
  let g = chartPanel
    .append("g")
    .attr("color", theme.text_color)
    .attr("transform", `translate(0,${card.height - chartHeight})`);
  g.call(xAxis_woy);
  //custom x axis
  g.select(".domain").attr("d", `M0.5,0.5H${chartWidth}.5`);

  chartPanel
    .selectAll(".bar")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("fill", theme.line_chart_color)
    .attr("x", function (d, index) {
      return x(index);
    })
    .attr("y", function (d) {
      return y(Number(d));
    })
    .attr("width", x.bandwidth())
    .attr("height", function (d) {
      return chartHeight - y(Number(d));
    });

  return card.toString();
}

module.exports = createProductiveCard;
