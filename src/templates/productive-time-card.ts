import {Card} from './card';
import {Theme} from '../const/theme';
import * as d3 from 'd3';
import * as d3Axis from 'd3-axis';

export function createProductiveCard(chartData: number[], theme: Theme, timezone: String) {
    const title = 'Commits ' + '(' + timezone + ')';
    const card = new Card(title, 340, 200, theme);
    const svg = card.getSVG();

    const chartWidth = card.width - 60;
    const chartHeight = 100;
    const bottomScaleBand = d3.scaleBand<number>().range([0, chartWidth]).padding(0.1);
    const bottomAxis: d3Axis.Axis<number> = d3Axis.axisBottom(bottomScaleBand);

    if (chartData.length != 24) {
        throw Error('productive time array size should be 24');
    }

    bottomScaleBand.domain(
        chartData.map(function (_: number, index: number, __: number[]) {
            return index;
        })
    );

    // eslint-disable-next-line prefer-spread
    const yMax = Math.max.apply(
        Math,
        chartData.map(function (d: any) {
            return d;
        })
    );

    const y = d3.scaleLinear().range([chartHeight, 0]);
    y.domain([0, yMax]);
    y.nice();

    const chartPanel = svg
        .append('g')
        .attr('color', theme.chart)
        .attr('transform', `translate(${(card.width - chartWidth) / 2 + 5},${card.yPadding / 2})`);
    const xAxis = bottomAxis.tickValues([0, 6, 12, 18, 23]);

    // Add the X Axis
    const g = chartPanel.append('g').attr('color', theme.text).attr('transform', `translate(0,${chartHeight})`);
    g.call(xAxis);

    // custom x axis, here is svg magic
    // Add more space for first bar
    g.select('.domain').attr(
        'd',
        `M${0 - bottomScaleBand(1)! + bottomScaleBand(0)! + bottomScaleBand.bandwidth()},0.5H${chartWidth}.5`
    );

    // Add the Y Axis
    chartPanel
        .append('g')
        .attr('color', theme.text)
        // Add gap before first bar
        .attr(
            'transform',
            `translate(${0 - bottomScaleBand(1)! + bottomScaleBand(0)! + bottomScaleBand.bandwidth()},0)`
        )
        .call(d3.axisLeft(y).ticks(5));

    chartPanel
        .selectAll('.bar')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .style('hover', 'green')
        .attr('fill', theme.chart)
        .attr('x', function (_, index) {
            return bottomScaleBand(index)!;
        })
        .attr('y', function (d) {
            return y(Number(d));
        })
        .attr('width', bottomScaleBand.bandwidth())
        .attr('height', function (d) {
            return chartHeight - y(Number(d));
        });

    return card.toString();
}
