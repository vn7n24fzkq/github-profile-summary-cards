const Card = require("./card");
const d3 = require("d3");
const moment = require("moment");

function createDetailCard(title, userDetails, contributionsData, theme) {
  let card = new Card(title, 700, 200, theme);
  let svg = card.getSVG();

  //draw icon

  const panel = svg.append("g").attr("transform", `translate(30,30)`);
  let labelHeight = 14;
  panel
    .selectAll(null)
    .data(userDetails)
    .enter()
    .append("g")
    .attr("transform", (d) => {
      let y = labelHeight * d.index * 2;
      return `translate(0,${y})`;
    })
    .attr("width", labelHeight)
    .attr("height", labelHeight)
    .attr("fill", theme.icon_color)
    .html((d) => d.icon);

  //draw text
  panel
    .selectAll(null)
    .data(userDetails)
    .enter()
    .append("text")
    .text((d) => {
      return d.value;
    })
    .attr("x", labelHeight * 1.5)
    .attr("y", (d) => labelHeight * d.index * 2 + labelHeight)
    .style("fill", theme.text_color)
    .style("font-size", `${labelHeight}px`);

  //process chart data
  let lineChartData = [];
  for (let data of contributionsData) {
    let formatDate = moment(data.date).format("YYYY-MM");
    data.date = new Date(formatDate);
    let lastIndex = lineChartData.length - 1;
    if (
      lineChartData.length == 0 ||
      lineChartData[lastIndex].date.getTime() !== data.date.getTime()
    ) {
      lineChartData.push({
        contributionCount: data.contributionCount,
        date: data.date,
      }); //use new object
    } else {
      lineChartData[lastIndex].contributionCount += data.contributionCount;
    }
  }

  //prepare chart data
  let chartRightMargin = 30;
  let chartWidth = card.width - 2 * card.xPadding - chartRightMargin - 230;
  let chartHeight = card.height - 2 * card.yPadding;
  var x = d3.scaleTime().range([0, chartWidth]);
  x.domain(
    d3.extent(lineChartData, function (d) {
      return d.date;
    })
  );

  let yMax = Math.max.apply(
    Math,
    lineChartData.map(function (o) {
      return o.contributionCount;
    })
  );

  let y = d3.scaleLinear().range([chartHeight, 0]);
  y.domain([0, yMax]);

  let valueline = d3
    .area()
    .x(function (d) {
      return x(d.date);
    })
    .y0(y(0))
    .y1(function (d) {
      return y(d.contributionCount);
    })
    .curve(d3.curveMonotoneX);

  let chartPanel = svg
    .append("g")
    .attr("color", theme.line_chart_color)
    .attr(
      "transform",
      `translate(${card.width - chartWidth - card.xPadding},0)`
    );

  //draw chart line
  chartPanel
    .append("path")
    .data([lineChartData])
    .attr("transform", `translate(${-chartRightMargin},0)`)
    .attr("stroke", theme.line_chart_color)
    .attr("fill", theme.line_chart_color)
    .attr("opacity", 1)
    .attr("d", valueline);

  //Add the X Axis
  var xAxis_woy = d3
    .axisBottom(x)
    .tickFormat(d3.timeFormat("%y/%m"))
    .tickValues(lineChartData.map((d) => d.date));

  chartPanel
    .append("g")
    .attr("color", theme.text_color)
    .attr("transform", `translate(${-chartRightMargin},${chartHeight})`)
    .call(xAxis_woy);

  //Add the Y Axis
  chartPanel
    .append("g")
    .attr("color", theme.text_color)
    .attr("transform", `translate(${chartWidth - chartRightMargin},0)`)
    .call(d3.axisRight(y));

  //hard code this coordinate becuz I'm too lazy
  chartPanel
    .append("g")
    .append("text")
    .text("contributions in the last year")
    .attr("y", -15)
    .attr("x", 230)
    .style("fill", theme.text_color)
    .style("font-size", `10px`);

  return card.toString();
}

module.exports = createDetailCard;
