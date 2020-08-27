const { writeSVG, outputPath } = require("../../src/utils/svg-writer");
const fs = require("fs");

describe("Test output function", () => {
  it("test write svg can work", () => {
    writeSVG("test", "write-svg", "work");
    let content = fs.readFileSync(`${outputPath}test/write-svg.svg`, {
      encoding: "utf8",
      flag: "r",
    });
    expect(content).toEqual("work");
  });
});
