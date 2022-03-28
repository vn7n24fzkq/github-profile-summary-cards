import {Theme} from '../const/theme';
import * as d3 from 'd3';
import {JSDOM} from 'jsdom';
export class Card {
    title: string;
    width: number;
    height: number;
    xPadding: number;
    yPadding: number;
    body: d3.Selection<d3.ContainerElement, any, null, undefined>;
    svg: d3.Selection<SVGSVGElement, any, null, undefined>;
    constructor(title = 'Title', width = 1280, height = 1024, theme: Theme, xPadding = 30, yPadding = 40) {
        this.title = title;
        this.width = width;
        this.height = height;
        this.xPadding = xPadding;
        this.yPadding = yPadding;
        // use fake dom let us can get html element
        const fakeDom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        this.body = d3.select(fakeDom.window.document).select('body');
        this.svg = this.body
            .append('div')
            .attr('class', 'container')
            .append('svg')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.append('style').html(
            `* {
          font-family: 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif
        }`
        );
        this.svg
            .append('rect')
            .attr('x', 1.5)
            .attr('y', 1.5)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('height', '98%')
            .attr('width', '98%')
            .attr('stroke', `${theme.stroke}`)
            .attr('stroke-width', '1')
            .attr('fill', `${theme.background}`)
            .attr('stroke-opacity', 1);

        const isEmptyTitle = this.title == '';
        if (!isEmptyTitle) {
            this.svg
                .append('text')
                .attr('x', this.xPadding)
                .attr('y', this.yPadding)
                .style('font-size', `22px`)
                .style('fill', `${theme.title}`)
                .text(this.title);
        }
        this.svg = this.svg.append<SVGSVGElement>('g').attr('transform', 'translate(0,40)');
    }

    getSVG() {
        return this.svg;
    }

    toString() {
        return this.body.select('.container').html();
    }
}
