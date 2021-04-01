const Card = require('./card');
const d3 = require('d3');

function createDonutChartCard(title, data, theme) {
    const pie = d3.pie().value(function (d) {
        return d.value;
    });
    const pieData = pie(data);
    const card = new Card(title, 340, 200, theme);

    const margin = 10;
    const radius =
        (Math.min(card.width, card.height) - 2 * margin - card.yPadding) / 2;

    const arc = d3
        .arc()
        .outerRadius(radius - 10)
        .innerRadius(radius / 2);

    const svg = card.getSVG();
    // draw language node

    const panel = svg
        .append('g')
        .attr('transform', `translate(${card.xPadding + margin},${0})`);
    const labelHeight = 14;
    panel
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('rect')
        .attr(
            'y',
            (d) => labelHeight * d.index * 1.8 + card.height / 2 - radius - 12
        ) // rect y-coordinate need fix,so I decrease y, but I don't know why this need fix.
        .attr('width', labelHeight)
        .attr('height', labelHeight)
        .attr('fill', (pieData) => pieData.data.color)
        .attr('stroke', `${theme.bg_color}`)
        .style('stroke-width', '1px');

    // set language text
    panel
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('text')
        .text((d) => {
            return d.data.name;
        })
        .attr('x', labelHeight * 1.2)
        .attr(
            'y',
            (d) => labelHeight * d.index * 1.8 + card.height / 2 - radius
        )
        .style('fill', theme.text_color)
        .style('font-size', `${labelHeight}px`);

    // draw pie chart
    const g = svg
        .append('g')
        .attr(
            'transform',
            `translate( ${card.width - radius - margin - card.xPadding}, ${
                (card.height - card.yPadding) / 2
            } )`
        )
        .selectAll('.arc')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'arc');

    g.append('path')
        .attr('d', arc)
        .style('fill', function (pieData) {
            return pieData.data.color;
        })
        .attr('stroke', `${theme.bg_color}`)
        .style('stroke-width', '2px');
    return card.toString();
}

module.exports = createDonutChartCard;
