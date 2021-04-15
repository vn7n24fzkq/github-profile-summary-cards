const d3 = require("d3");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

class Card {
  constructor(
    title = "Title",
    width = 1280,
    height = 1024,
    theme = Theme["default"]
  ) {
    this.title = title;
    this.width = width;
    this.height = height;
    this.xPadding = 30;
    this.yPadding = 40;
    // use fake dom let us can get html element
    const fakeDom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    this.body = d3.select(fakeDom.window.document).select("body");
    this.svg = this.body
      .append("div")
      .attr("class", "container")
      .append("svg")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`);
    this.svg.append("style").html(
      `* {
          font-family: Ubuntu, 'Lucida Grande', Arial, Helvetica, sans-serif
        }`
    );
    this.svg
      .append("rect")
      .attr("x", 1.5)
      .attr("y", 1.5)
      .attr("rx", 20)
      .attr("ry", 20)
      .attr("height", "98%")
      .attr("width", "98%")
      .attr("stroke", `${theme.stroke_color}`)
      .attr("stroke-width", "1.2")
      .attr("fill", `${theme.bg_color}`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    let isEmptyTitle = this.title == "";
    if (!isEmptyTitle) {
      this.svg
        .append("text")
        .attr("x", this.xPadding)
        .attr("y", this.yPadding)
        .style("font-size", `22px`)
        .style("fill", `${theme.title_color}`)
        .text(this.title);
    }
    this.svg = this.svg
      .append("g")
      .attr("transform", `translate(0,${isEmptyTitle ? 0 : this.yPadding})`);
  }

  getSVG() {
    return this.svg;
  }

  toString() {
    return this.body.select(".container").html();
  }
}

module.exports = Card;
