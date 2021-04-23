const Card = require('../../src/templates/card');
const ThemeMap = require('../../src/const/theme');

const getErrorMsgCard = function (msg, themeName) {
    const theme = ThemeMap.get(themeName);
    theme.title_color = 'red';

    const card = new Card('ERROR!!!', 340, 200, theme);
    const svg = card.getSVG();
    const panel = svg.append('g').attr('transform', `translate(30,20)`);
    panel
        .append('text')
        .attr('y', `${card.yPadding}`)
        .style('font-size', `14px`)
        .style('fill', 'red')
        .text(msg);

    return card.toString();
};

module.exports = {
    getErrorMsgCard,
};
