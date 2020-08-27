const Themes = require("../../src/const/theme");

describe("Validate all theme", () => {
  it("theme colors are match the color regex", () => {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    for (let themeName in Themes) {
      let theme = Themes[themeName];
      expect(theme.title_color).toMatch(colorRegex);
      expect(theme.text_color).toMatch(colorRegex);
      expect(theme.bg_color).toMatch(colorRegex);
      expect(theme.stroke_color).toMatch(colorRegex);
      expect(theme.icon_color).toMatch(colorRegex);
      expect(theme.line_chart_color).toMatch(colorRegex);
    }
  });
});
