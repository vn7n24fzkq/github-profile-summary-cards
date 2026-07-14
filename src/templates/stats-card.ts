import {Card} from './card';
import {Icon} from '../const/icon';
import {Theme} from '../const/theme';

export function createStatsCard(
    title: string,
    statsData: {index: number; icon: string; name: string; value: string}[],
    theme: Theme
) {
    const card = new Card(title, 340, 200, theme);
    const svg = card.getSVG();

    // draw icon
    const panel = svg.append('g').attr('transform', `translate(30,20)`);
    const labelHeight = 14;
    // Each stat row is an animatable item; icon + name + value share --gpsc-i so
    // they reveal together, one row at a time. The icon's position lives on an inner
    // transform-free-of-CSS group: the animatable `.gpsc-item` wrapper carries no
    // transform attribute, so a CSS transform animation (rise/grow) can't clobber the
    // icon's SVG translate.
    panel
        .selectAll(null)
        .data(statsData)
        .enter()
        .append('g')
        .attr('class', 'gpsc-item')
        .style('--gpsc-i', d => String(d.index))
        .append('g')
        .attr('transform', d => {
            const y = labelHeight * d.index * 1.8;
            return `translate(0,${y})`;
        })
        .attr('width', labelHeight)
        .attr('height', labelHeight)
        .attr('fill', theme.icon)
        .html(d => d.icon);

    // draw text
    panel
        .selectAll(null)
        .data(statsData)
        .enter()
        .append('text')
        .text(d => {
            return `${d.name}`;
        })
        .attr('x', labelHeight * 1.5)
        .attr('y', d => labelHeight * d.index * 1.8 + labelHeight)
        .attr('class', 'gpsc-item')
        .style('--gpsc-i', d => String(d.index))
        .style('fill', theme.text)
        .style('font-size', `${labelHeight}px`);

    panel
        .selectAll(null)
        .data(statsData)
        .enter()
        .append('text')
        .text(d => {
            return `${d.value}`;
        })
        .attr('x', 130)
        .attr('y', d => labelHeight * d.index * 1.8 + labelHeight)
        .attr('class', 'gpsc-item')
        .style('--gpsc-i', d => String(d.index))
        .style('fill', theme.text)
        .style('font-size', `${labelHeight}px`);

    const panelForGitHubLogo = svg.append('g').attr('transform', `translate(220,20)`);
    panelForGitHubLogo.append('g').attr('transform', `scale(6)`).style('fill', theme.icon).html(Icon.GITHUB);

    return card.toString();
}
