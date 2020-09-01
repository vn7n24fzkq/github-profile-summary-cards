const { writeSVG, outputPath } = require("../../src/utils/file-writer");
const fs = require("fs");
const targetFolder = `${outputPath}/test`;


afterEach(() => {
    fs.rmdirSync(targetFolder, { recursive: true });
});
describe("Test output function", () => {
  it("test write svg can work", () => {
    writeSVG("test", "write-svg", "work");
    let content = fs.readFileSync(`${targetFolder}/write-svg.svg`, {
      encoding: "utf8",
      flag: "r",
    });
    expect(content).toEqual("work");
  });
});
