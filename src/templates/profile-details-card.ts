import {Card, TITLE_LINE_HEIGHT} from './card';
import * as d3 from 'd3';
import {Theme} from '../const/theme';

export function createDetailCard(
    title: string,
    userDetails: {
        index: number;
        icon: string;
        name: string;
        value: string;
    }[],
    contributionsData: {contributionCount: number; date: Date}[],
    theme: Theme,
    chartCaption: string = 'contributions in the last year'
) {
    // A wrapped (two-line) title consumes one extra TITLE_LINE_HEIGHT of vertical
    // space; grow the canvas to match so the details rows, chart and caption don't
    // get pushed off the bottom of the (otherwise fixed) 200-px card.
    const extraTitleLines = Math.max(0, title.split('\n').length - 1);
    const card = new Card(title, 700, 200 + extraTitleLines * TITLE_LINE_HEIGHT, theme);
    const svg = card.getSVG();

    // draw icon
    const panel = svg.append('g').attr('transform', `translate(30,30)`);
    const labelHeight = 14;
    // Each detail row (icon + value) is an animatable item sharing --gpsc-i, so rows
    // reveal one at a time. The icon's SVG translate lives on an inner group so the
    // transform-free `.gpsc-item` wrapper can be safely CSS-transformed.
    panel
        .selectAll(null)
        .data(userDetails)
        .enter()
        .append('g')
        .attr('class', 'gpsc-item')
        .style('--gpsc-i', d => String(d.index))
        .append('g')
        .attr('transform', d => {
            const y = labelHeight * d.index * 2;
            return `translate(0,${y})`;
        })
        .attr('width', labelHeight)
        .attr('height', labelHeight)
        .attr('fill', theme.icon)
        .html(d => d.icon);

    // draw text
    panel
        .selectAll(null)
        .data(userDetails)
        .enter()
        .append('text')
        .text(d => {
            return d.value;
        })
        .attr('x', labelHeight * 1.5)
        .attr('y', d => labelHeight * d.index * 2 + labelHeight)
        .attr('class', 'gpsc-item')
        .style('--gpsc-i', d => String(d.index))
        .style('fill', theme.text)
        .style('font-size', `${labelHeight}px`);

    // process chart data
    const lineChartData: {contributionCount: number; date: Date}[] = [];
    const formatter = d3.timeFormat('%Y-%m');
    for (const data of contributionsData) {
        const formatDate = formatter(data.date);
        // Fix: Append day to ensure valid ISO 8601 date (YYYY-MM-DD) for reliable parsing
        data.date = new Date(`${formatDate}-01`);
        const lastIndex = lineChartData.length - 1;
        if (lineChartData.length == 0 || lineChartData[lastIndex].date.getTime() !== data.date.getTime()) {
            lineChartData.push({
                contributionCount: data.contributionCount,
                date: data.date
            }); // use new object
        } else {
            lineChartData[lastIndex].contributionCount += data.contributionCount;
        }
    }

    // prepare chart data
    const chartRightMargin = 30;
    const chartWidth = card.width - 2 * card.xPadding - chartRightMargin - 230;
    // Keep the chart the same physical size regardless of a wrapped title: the extra
    // canvas height is padding that pushes the chart down, not room for it to grow
    // into (otherwise the taller chart's x-axis overruns the caption below it).
    const extraTitleHeight = extraTitleLines * TITLE_LINE_HEIGHT;
    const chartHeight = card.height - extraTitleHeight - 2 * card.yPadding - 10;
    const x = d3.scaleTime().range([0, chartWidth]);

    x.domain(
        <[Date, Date]>d3.extent(lineChartData, function (d) {
            return d.date;
        })
    );

    // eslint-disable-next-line prefer-spread
    const yMax = Math.max.apply(
        Math,
        lineChartData.map(function (o) {
            return o.contributionCount;
        })
    );

    const y = d3.scaleLinear().range([chartHeight, 0]);
    y.domain([0, yMax]);
    y.nice();

    const valueline = d3
        .area<{contributionCount: number; date: Date}>()
        .x(function (d) {
            return x(d.date);
        })
        .y0(y(0))
        .y1(function (d) {
            return y(d.contributionCount);
        })
        .curve(d3.curveMonotoneX);

    const chartPanel = svg
        .append('g')
        .attr('color', theme.chart)
        .attr('transform', `translate(${card.width - chartWidth - card.xPadding + 5},10)`);

    // Inert reveal clip: a full-size rect clipping the area chart. By default it
    // covers the whole plotting region (no visual change); a "reveal"/"sequence"
    // animation scales it in from the left so the area draws on along the x-axis.
    const REVEAL_CLIP_ID = 'gpsc-reveal-clip';
    const revealWidth = chartWidth + chartRightMargin;
    chartPanel
        .append('clipPath')
        .attr('id', REVEAL_CLIP_ID)
        .append('rect')
        .attr('class', 'gpsc-reveal')
        .attr('x', -chartRightMargin)
        .attr('y', 0)
        .attr('width', revealWidth)
        .attr('height', chartHeight)
        // Full width available to the wipe animation, which slides the clip in from
        // the left by this many px (a reliably left-to-right reveal; no
        // transform-origin). The index places the wipe after the detail rows.
        .style('--gpsc-w', `${revealWidth}px`)
        .style('--gpsc-i', String(userDetails.length));

    // draw chart line (inside a transform-less, clipped wrapper so the reveal clip
    // lines up with the plotting area). The wrapper is an animatable item (revealed
    // after the detail rows) so it fades in for the non-drawing presets.
    chartPanel
        .append('g')
        .attr('clip-path', `url(#${REVEAL_CLIP_ID})`)
        // `.gpsc-chart` (not `.gpsc-item`): the non-drawing presets fade it in with
        // the content, while the drawing presets (draw/load/sequence) leave its
        // opacity alone and reveal it purely via the `.gpsc-reveal` clip wipe — so
        // the two never fight and the line always draws from the left.
        .attr('class', 'gpsc-chart')
        .style('--gpsc-i', String(userDetails.length))
        .append('path')
        .data([lineChartData])
        .attr('transform', `translate(${-chartRightMargin},0)`)
        .attr('stroke', theme.chart)
        .attr('fill', theme.chart)
        .attr('opacity', 1)
        .attr('d', valueline);

    // Add the X Axis
    const xAxis = d3
        .axisBottom<Date>(x)
        .tickFormat(d3.timeFormat('%y/%m'))
        .tickValues(
            lineChartData
                .filter((_, i) => {
                    return i % 2 === 0;
                })
                .map(d => {
                    return d.date;
                })
        );

    chartPanel
        .append('g')
        .attr('color', theme.text)
        .attr('transform', `translate(${-chartRightMargin},${chartHeight})`)
        .call(xAxis);

    // Add the Y Axis
    chartPanel
        .append('g')
        .attr('color', theme.text)
        .attr('transform', `translate(${chartWidth - chartRightMargin},0)`)
        .call(d3.axisRight(y).ticks(8));

    // Caption goes above the chart for short titles, below the chart for tall/long titles
    // (multi-line titles push the chart down and the caption would otherwise overlap them).
    const titleIsTall = title.includes('\n') || title.length > 30;
    chartPanel
        .append('g')
        .append('text')
        .text(chartCaption)
        .attr('y', titleIsTall ? 140 : -15)
        .attr('x', 230)
        .style('fill', theme.text)
        .style('font-size', `10px`);

    return card.toString();
}
