const Theme = require("../const/theme");
const Card = require("./card");

class TopLangCard extends Card {
  constructor(
    username,
    title = "TopLangCard",
    width = 320,
    height = 180,
    theme = Theme.default
  ) {
    super(title, width, height, theme);
    this.username = username;
  }
  getContentSVG() {
    return `
        `;
  }
}

module.exports = TopLangCard;
