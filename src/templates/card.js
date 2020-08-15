const Theme = require("../const/theme");

class Card {
  constructor(
    title = "Title",
    width = 320,
    height = 180,
    theme = Theme.default
  ) {
    this.title = title;
    this.paddingX = 20;
    this.paddingY = 30;
    this.theme = theme;
    this.width = width;
    this.height = height;
  }

  getContentSVG() {
    return "";
  }

  getSVG() {
    return `
      <svg
        height= "${this.height}"
        width= "${this.width}"
        viewBox="0 0 ${this.width} ${this.height}"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
      <style>
      ${this.theme}
      </style>
      
      <rect
        data-testid="card-bg"
        rx="4.0"
        ry="4.0"
        height="100%"
        stroke="#E4E2E2"
        fill="#006600"
        stroke-opacity="1"
        />

      <g
        data-testid="card-title"
        transform="translate(${this.paddingX}, ${this.paddingY})"
      >
      <text
        class="card-title"
        data-testid="card-title"
      >
      ${this.title}
      </text>
      </g>
        <g
          data-testid="card-content"
        >
        </g>
      </svg>
          `;
  }
}

module.exports = Card;
