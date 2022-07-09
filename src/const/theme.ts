export const ThemeMap = new Map<string, Theme>();

export class Theme {
    title: string;
    text: string;
    background: string;
    stroke: string;
    icon: string;
    chart: string;
    constructor(title: string, text: string, background: string, stroke: string, icon: string, chart: string) {
        this.title = title;
        this.text = text;
        this.background = background;
        this.stroke = stroke;
        this.icon = icon;
        this.chart = chart;
    }
}

// Set up themes
ThemeMap.set('default', new Theme('#586e75', '#586e75', '#ffffff', '#e4e2e2', '#586e75', '#586e75'));
ThemeMap.set('2077', new Theme('#ff0055', '#03d8f3', '#141321', '#141321', '#fcee0c', '#00ffc8'));
ThemeMap.set('dracula', new Theme('#ff79c6', '#ffb86c', '#282a36', '#282a36', '#6272a4', '#bd93f9'));
ThemeMap.set('github', new Theme('#0366d6', '#586069', '#ffffff', '#e4e2e2', '#586069', '#40c463'));
ThemeMap.set('github_dark', new Theme('#0366d6', '#77909c', '#0d1117', '#2e343b', '#8b949e', '#40c463'));
ThemeMap.set('gruvbox', new Theme('#fabd2f', '#8ec07c', '#282828', '#282828', '#fe8019', '#fe8019'));
ThemeMap.set('monokai', new Theme('#eb1f6a', '#ffffff', '#2c292d', '#2c292d', '#e28905', '#ae81ff'));
ThemeMap.set('nord_bright', new Theme('#3b4252', '#2e3440', '#eceff4', '#e5e9f0', '#8fbcbb', '#88c0d0'));
ThemeMap.set('nord_dark', new Theme('#eceff4', '#e5e9f0', '#2e3440', '#eceff4', '#8fbcbb', '#88c0d0'));
ThemeMap.set('radical', new Theme('#fe428e', '#a9fef7', '#141321', '#141321', '#f8d847', '#ae81ff'));
ThemeMap.set('solarized', new Theme('#268bd2', '#586e75', '#fdf6e3', '#fdf6e3', '#b58900', '#859900'));
ThemeMap.set('solarized_dark', new Theme('#268bd2', '#839496', '#073642', '#073642', '#b58900', '#859900'));
ThemeMap.set('tokyonight', new Theme('#70a5fd', '#38bdae', '#1a1b27', '#1a1b27', '#bf91f3', '#bf91f3'));
ThemeMap.set('vue', new Theme('#41b883', '#000000', '#ffffff', '#e4e2e2', '#41b883', '#41b883'));
ThemeMap.set('zenburn', new Theme('#f0dfaf', '#dcdccc', '#3f3f3f', '#3f3f3f', '#8cd0d3', '#7f9f7f'));
