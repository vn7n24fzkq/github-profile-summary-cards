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
// We support short hex color, hex color and RGBA hex
// ThemeMap.set(name, new Theme('title', 'text', 'background', 'stroke', 'icon', 'chart'));
ThemeMap.set('2077', new Theme('#ff0055', '#03d8f3', '#141321', '#141321', '#fcee0c', '#00ffc8'));
ThemeMap.set('algolia', new Theme('#00aeff', '#ffffff', '#050f2c', '#00000000', '#2dde98', '#00aeff'));
ThemeMap.set('apprentice', new Theme('#ffffff', '#bcbcbc', '#262626', '#00000000', '#ffffaf', '#ffffff'));
ThemeMap.set('aura_dark', new Theme('#ff7372', '#dbdbdb', '#252334', '#00000000', '#6cffd0', '#ff7372'));
ThemeMap.set('aura', new Theme('#a277ff', '#61ffca', '#15141b', '#00000000', '#ffca85', '#a277ff'));
ThemeMap.set('ayu_mirage', new Theme('#f4cd7c', '#c7c8c2', '#1f2430', '#00000000', '#73d0ff', '#f4cd7c'));
ThemeMap.set('bear', new Theme('#e03c8a', '#bcb28d', '#1f2023', '#00000000', '#00aeff', '#e03c8a'));
ThemeMap.set('blue_green', new Theme('#2f97c1', '#0cf574', '#040f0f', '#00000000', '#f5b700', '#2f97c1'));
ThemeMap.set('blueberry', new Theme('#82aaff', '#27e8a7', '#242938', '#00000000', '#89ddff', '#82aaff'));
ThemeMap.set('buefy', new Theme('#7957d5', '#363636', '#ffffff', '#00000000', '#ff3860', '#7957d5'));
ThemeMap.set('calm', new Theme('#e07a5f', '#ebcfb2', '#373f51', '#00000000', '#edae49', '#e07a5f'));
ThemeMap.set('chartreuse_dark', new Theme('#7fff00', '#fff', '#000', '#000000', '#00aeff', '#7fff00'));
ThemeMap.set('city_lights', new Theme('#5d8cb3', '#718ca1', '#1d252c', '#00000000', '#4798ff', '#5d8cb3'));
ThemeMap.set('cobalt', new Theme('#e683d9', '#75eeb2', '#193549', '#00000000', '#0480ef', '#e683d9'));
ThemeMap.set('cobalt2', new Theme('#ffc600', '#0088ff', '#193549', '#00000000', '#ffffff', '#ffc600'));
ThemeMap.set('codeSTACKr', new Theme('#ff652f', '#ffffff', '#09131b', '#0c1a25', '#ffe400', '#ff652f'));
ThemeMap.set('darcula', new Theme('#ba5f17', '#bebebe', '#242424', '#00000000', '#ffb74d', '#ba5f17'));
ThemeMap.set('dark', new Theme('#fff', '#9f9f9f', '#151515', '#00000000', '#79ff97', '#fff'));
ThemeMap.set('date_night', new Theme('#da7885', '#e1b2a2', '#170f0c', '#170f0c', '#bb8470', '#da7885'));
ThemeMap.set('default', new Theme('#586e75', '#586e75', '#ffffff', '#e4e2e2', '#586e75', '#586e75'));
ThemeMap.set('discord_old_blurple', new Theme('#7289da', '#ffffff', '#2c2f33', '#00000000', '#7289da', '#7289da'));
ThemeMap.set('dracula', new Theme('#ff79c6', '#ffb86c', '#282a36', '#282a36', '#6272a4', '#bd93f9'));
ThemeMap.set('flag_india', new Theme('#ff8f1c', '#509e2f', '#ffffff', '#00000000', '#250e62', '#ff8f1c'));
ThemeMap.set('github_dark', new Theme('#0366d6', '#77909c', '#0d1117', '#2e343b', '#8b949e', '#40c463'));
ThemeMap.set('github', new Theme('#0366d6', '#586069', '#ffffff', '#e4e2e2', '#586069', '#40c463'));
ThemeMap.set('gotham', new Theme('#2aa889', '#99d1ce', '#0c1014', '#00000000', '#599cab', '#2aa889'));
ThemeMap.set('graywhite', new Theme('#24292e', '#24292e', '#ffffff', '#00000000', '#24292e', '#24292e'));
ThemeMap.set('great_gatsby', new Theme('#ffa726', '#ffd95b', '#000000', '#00000000', '#ffb74d', '#ffa726'));
ThemeMap.set('gruvbox', new Theme('#fabd2f', '#8ec07c', '#282828', '#282828', '#fe8019', '#fe8019'));
ThemeMap.set('highcontrast', new Theme('#e7f216', '#fff', '#000', '#00000000', '#00ffff', '#e7f216'));
ThemeMap.set('jolly', new Theme('#ff64da', '#ffffff', '#291b3e', '#00000000', '#a960ff', '#ff64da'));
ThemeMap.set('kacho_ga', new Theme('#bf4a3f', '#d9c8a9', '#402b23', '#00000000', '#a64833', '#bf4a3f'));
ThemeMap.set('maroongold', new Theme('#f7ef8a', '#e0aa3e', '#260000', '#00000000', '#f7ef8a', '#f7ef8a'));
ThemeMap.set('material_palenight', new Theme('#c792ea', '#a6accd', '#292d3e', '#00000000', '#89ddff', '#c792ea'));
ThemeMap.set('merko', new Theme('#abd200', '#68b587', '#0a0f0b', '#00000000', '#b7d364', '#abd200'));
ThemeMap.set('midnight_purple', new Theme('#9745f5', '#ffffff', '#000000', '#00000000', '#9f4bff', '#9745f5'));
ThemeMap.set('moltack', new Theme('#86092c', '#574038', '#f5e1c0', '#00000000', '#86092c', '#86092c'));
ThemeMap.set('monokai', new Theme('#eb1f6a', '#ffffff', '#2c292d', '#2c292d', '#e28905', '#ae81ff'));
ThemeMap.set('moonlight', new Theme('#ff757f', '#f8f8f8', '#222436', '#222436', '#599dff', '#ff757f'));
ThemeMap.set('nightowl', new Theme('#c792ea', '#7fdbca', '#011627', '#00000000', '#ffeb95', '#c792ea'));
ThemeMap.set('noctis_minimus', new Theme('#d3b692', '#c5cdd3', '#1b2932', '#00000000', '#72b7c0', '#d3b692'));
ThemeMap.set('nord_bright', new Theme('#3b4252', '#2e3440', '#eceff4', '#e5e9f0', '#8fbcbb', '#88c0d0'));
ThemeMap.set('nord_dark', new Theme('#eceff4', '#e5e9f0', '#2e3440', '#eceff4', '#8fbcbb', '#88c0d0'));
ThemeMap.set('ocean_dark', new Theme('#8957b2', '#92d534', '#151a28', '#00000000', '#ffffff', '#8957b2'));
ThemeMap.set('omni', new Theme('#ff79c6', '#e1e1e6', '#191622', '#00000000', '#e7de79', '#ff79c6'));
ThemeMap.set('onedark', new Theme('#e4bf7a', '#df6d74', '#282c34', '#00000000', '#8eb573', '#e4bf7a'));
ThemeMap.set('outrun', new Theme('#ffcc00', '#8080ff', '#141439', '#00000000', '#ff1aff', '#ffcc00'));
ThemeMap.set('panda', new Theme('#19f9d899', '#ff75b5', '#31353a', '#00000000', '#19f9d899', '#19f9d899'));
ThemeMap.set('prussian', new Theme('#bddfff', '#6e93b5', '#172f45', '#00000000', '#38a0ff', '#bddfff'));
ThemeMap.set('radical', new Theme('#fe428e', '#a9fef7', '#141321', '#141321', '#f8d847', '#ae81ff'));
ThemeMap.set('react', new Theme('#61dafb', '#ffffff', '#20232a', '#00000000', '#61dafb', '#61dafb'));
ThemeMap.set('rose_pine', new Theme('#9ccfd8', '#e0def4', '#191724', '#00000000', '#ebbcba', '#9ccfd8'));
ThemeMap.set('shades_of_purple', new Theme('#fad000', '#a599e9', '#2d2b55', '#00000000', '#b362ff', '#fad000'));
ThemeMap.set('slateorange', new Theme('#faa627', '#ffffff', '#36393f', '#00000000', '#faa627', '#faa627'));
ThemeMap.set('solarized_dark', new Theme('#268bd2', '#839496', '#073642', '#073642', '#b58900', '#859900'));
ThemeMap.set('solarized', new Theme('#268bd2', '#586e75', '#fdf6e3', '#fdf6e3', '#b58900', '#859900'));
ThemeMap.set('swift', new Theme('#000000', '#000000', '#f7f7f7', '#00000000', '#f05237', '#000000'));
ThemeMap.set('synthwave', new Theme('#e2e9ec', '#e5289e', '#2b213a', '#00000000', '#ef8539', '#e2e9ec'));
ThemeMap.set('tokyonight', new Theme('#70a5fd', '#38bdae', '#1a1b27', '#1a1b27', '#bf91f3', '#bf91f3'));
ThemeMap.set('transparent', new Theme('#006AFF', '#417E87', '#00000000', '#00000000', '#0579C3', '#006AFF'));
ThemeMap.set('vision_friendly_dark', new Theme('#ffb000', '#ffffff', '#000000', '#00000000', '#785ef0', '#ffb000'));
ThemeMap.set('vue', new Theme('#41b883', '#000000', '#ffffff', '#e4e2e2', '#41b883', '#41b883'));
ThemeMap.set('yeblu', new Theme('#ffff00', '#ffffff', '#002046', '#00000000', '#ffff00', '#ffff00'));
ThemeMap.set('zenburn', new Theme('#f0dfaf', '#dcdccc', '#3f3f3f', '#3f3f3f', '#8cd0d3', '#7f9f7f'));
