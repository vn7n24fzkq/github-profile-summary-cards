const d3 = require("d3");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

class Card {
  constructor(height = 1024, width = 1280) {
    this.height = height;
    this.width = width;
    // use fake dom let us can get html element
    const fakeDom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    this.body = d3.select(fakeDom.window.document).select("body");
    this.svg = this.body
      .append("div")
      .attr("class", "container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
  }

  getSVG() {
    return this.svg;
  }

  toString() {
    return this.body.select(".container").html();
  }
}

module.exports = Card;
