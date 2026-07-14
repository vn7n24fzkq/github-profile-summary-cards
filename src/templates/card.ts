import {Theme} from '../const/theme';
import * as d3 from 'd3';
import {JSDOM} from 'jsdom';

// Vertical space each additional title line occupies. Exported so cards that use
// multi-line titles (e.g. profile-details) can grow their canvas by the same
// amount instead of letting extra lines push content off the bottom.
export const TITLE_LINE_HEIGHT = 24;

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
        const svgRoot = this.body
            .append('div')
            .attr('class', 'container')
            .append('svg')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${this.width} ${this.height}`);
        svgRoot.append('style').html(
            `* {
          font-family: 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif
        }`
        );
        // All visible content lives inside a transform-less wrapper group. A per-request
        // animation (injected as a <style> block; see api/utils/handle-card.ts) targets
        // the individual content atoms (`.gpsc-item`, each with a `--gpsc-i` index) and
        // the chart classes, leaving the background rect (a direct `<rect>` child)
        // untouched so it shows immediately.
        const root = svgRoot.append('g').attr('class', 'gpsc-root');
        const strokeWidth = 1;
        root.append('rect')
            .attr('x', 1)
            .attr('y', 1)
            .attr('rx', 5)
            .attr('ry', 5)
            // 100% - 2px to show borderline
            .attr('height', `${((height - 2 * strokeWidth) / height) * 100}%`)
            // 100% - 2px to show borderline
            .attr('width', `${((width - 2 * strokeWidth) / width) * 100}%`)
            .attr('stroke', `${theme.stroke}`)
            .attr('stroke-width', strokeWidth)
            .attr('fill', `${theme.background}`)
            .attr('stroke-opacity', `${theme.strokeOpacity}`);

        // Multi-line titles: callers pass `\n` to break the title (e.g. when login + name
        // would otherwise overflow into the chart area in profile-details). Each line is
        // rendered as its own <text> stacked at TITLE_LINE_HEIGHT.
        const titleLines = this.title === '' ? [] : this.title.split('\n');
        titleLines.forEach((line, i) => {
            root.append('text')
                .attr('x', this.xPadding)
                .attr('y', this.yPadding + i * TITLE_LINE_HEIGHT)
                // Animatable content atom (see src/utils/animation.ts); the title is the
                // first item so it carries the lowest --gpsc-i.
                .attr('class', 'gpsc-item')
                .style('--gpsc-i', String(i))
                .style('font-size', `22px`)
                .style('fill', `${theme.title}`)
                .text(line);
        });
        // Push the body group down to clear the rendered title block.
        // Empty/single-line titles preserve the historic 40-px translate so all existing
        // single-line cards render byte-identically.
        const bodyOffset = titleLines.length <= 1 ? 40 : 40 + (titleLines.length - 1) * TITLE_LINE_HEIGHT;
        this.svg = root.append<SVGSVGElement>('g').attr('transform', `translate(0,${bodyOffset})`);
    }

    getSVG() {
        return this.svg;
    }

    toString() {
        return this.body.select('.container').html();
    }
}
