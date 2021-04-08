const ThemeMap = new Map();

ThemeMap.set('default', {
    title_color: '#586e75',
    text_color: '#586e75',
    bg_color: '#ffffff',
    stroke_color: '#e4e2e2',
    icon_color: '#586e75',
    line_chart_color: '#586e75',
});
ThemeMap.set('solarized', {
    title_color: '#268bd2',
    text_color: '#586e75',
    bg_color: '#fdf6e3',
    stroke_color: '#fdf6e3',
    icon_color: '#b58900',
    line_chart_color: '#859900',
});
ThemeMap.set('solarized_dark', {
    title_color: '#268bd2',
    text_color: '#839496',
    bg_color: '#073642',
    stroke_color: '#073642',
    icon_color: '#b58900',
    line_chart_color: '#859900',
});
ThemeMap.set('vue', {
    title_color: '#41b883',
    text_color: '#000000',
    bg_color: '#ffffff',
    stroke_color: '#e4e2e2',
    icon_color: '#41b883',
    line_chart_color: '#41b883',
});
ThemeMap.set('dracula', {
    title_color: '#ff79c6',
    text_color: '#ffb86c',
    bg_color: '#282a36',
    stroke_color: '#282a36',
    icon_color: '#6272a4',
    line_chart_color: '#bd93f9',
});
ThemeMap.set('monokai', {
    title_color: '#eb1f6a',
    text_color: '#ffffff',
    bg_color: '#2c292d',
    stroke_color: '#2c292d',
    icon_color: '#e28905',
    line_chart_color: '#ae81ff',
});
ThemeMap.set('nord_bright', {
    title_color: '#3b4252',
    text_color: '#2e3440',
    bg_color: '#eceff4',
    stroke_color: '#e5e9f0',
    icon_color: '#8fbcbb',
    line_chart_color: '#88c0d0',
});
ThemeMap.set('nord_dark', {
    title_color: '#eceff4',
    text_color: '#e5e9f0',
    bg_color: '#2e3440',
    stroke_color: '#eceff4',
    icon_color: '#8fbcbb',
    line_chart_color: '#88c0d0',
});
ThemeMap.set('github', {
    title_color: '#0366d6',
    text_color: '#586069',
    bg_color: '#ffffff',
    stroke_color: '#e4e2e2',
    icon_color: '#586069',
    line_chart_color: '#40c463',
});
ThemeMap.set('github_dark', {
    title_color: '#0366d6',
    text_color: '#77909c',
    bg_color: '#0d1117',
    stroke_color: '#2e343b',
    icon_color: '#8b949e',
    line_chart_color: '#40c463',
});

module.exports = ThemeMap;
