const Card = require('./card');
const Icons = require('../const/icon');

function createStatsCard(title, statsData, theme) {
    const card = new Card(title, 340, 200, theme);
    const svg = card.getSVG();

    // draw icon
    const panel = svg.append('g').attr('transform', `translate(30,20)`);
    const labelHeight = 14;
    panel
        .selectAll(null)
        .data(statsData)
        .enter()
        .append('g')
        .attr('transform', (d) => {
            const y = labelHeight * d.index * 1.8;
            return `translate(0,${y})`;
        })
        .attr('width', labelHeight)
        .attr('height', labelHeight)
        .attr('fill', theme.icon_color)
        .html((d) => d.icon);

    // draw text
    panel
        .selectAll(null)
        .data(statsData)
        .enter()
        .append('text')
        .text((d) => {
            return `${d.name}`;
        })
        .attr('x', labelHeight * 1.5)
        .attr('y', (d) => labelHeight * d.index * 1.8 + labelHeight)
        .style('fill', theme.text_color)
        .style('font-size', `${labelHeight}px`);

    panel
        .selectAll(null)
        .data(statsData)
        .enter()
        .append('text')
        .text((d) => {
            return `${d.value}`;
        })
        .attr('x', 130)
        .attr('y', (d) => labelHeight * d.index * 1.8 + labelHeight)
        .style('fill', theme.text_color)
        .style('font-size', `${labelHeight}px`);

    const panelForGitHubLogo = svg
        .append('g')
        .attr('transform', `translate(220,20)`);
    panelForGitHubLogo
        .append('g')
        .attr('transform', `scale(6)`)
        .style('fill', theme.icon_color)
        .html(Icons.GITHUB);

    return card.toString();
}

module.exports = createStatsCard;
