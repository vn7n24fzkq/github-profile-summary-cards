const d3 = require("d3");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

class Card {
  constructor(title = "Title", width = 1280, height = 1024, theme=Theme["default"]) {
    this.title = title;
    this.width = width;
    this.height = height;
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
    this.svg
      .append("rect")
      .attr("x", 2)
      .attr("y", 2)
      .attr("rx", 20)
      .attr("ry", 20)
      .attr("height", "98%")
      .attr("width", "98%")
      .attr("stroke", `${theme.stroke_color}`)
      .attr("stroke-width", "4")
      .attr("fill", `${theme.bg_color}`)
      .attr("stroke-opacity", 1);

    let isEmptyTitle = this.title == "";
    if (!isEmptyTitle) {
      this.svg
        .append("text")
        .attr("x", 30)
        .attr("y", 40)
        .style("font-family", "sans-serif")
        .style("font-size", `25px`)
        .style("fill", `${theme.title_color}`)
        .text(this.title);
    }
    this.svg = this.svg
      .append("g")
      .attr("transform", `translate(0,${isEmptyTitle ? 0 : 30})`);
  }

  getSVG() {
    return this.svg;
  }

  toString() {
    return this.body.select(".container").html();
  }
}

module.exports = Card;
