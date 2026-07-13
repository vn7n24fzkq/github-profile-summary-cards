<div align="center">
   <h1>GitHub Profile Summary Cards</h1>


   [English](/README.md) | [简体中文](/docs/README_zh-CN.md) | [繁體中文](/docs/README_zh-tw.md)
   <p>
      一个用来生成github个人简介摘要的工具. 受到 <a href=https://github.com/tipsy/profile-summary-for-github>profile-summary-for-github</a>的启发
   </p>
   <p>
      :star: 欢迎大家随时贡献 :star:
   </p>
   <p align="center">
      <a href="https://github.com/vn7n24fzkq/github-profile-summary-cards/stargazers">
      <img alt="Stargazers" src="https://img.shields.io/github/stars/vn7n24fzkq/github-profile-summary-cards?style=for-the-badge&logo=github&color=f4dbd6&logoColor=D9E0EE&labelColor=302D41"></a>
      <a href="https://github.com/vn7n24fzkq/github-profile-summary-cards/releases/latest">
      <img alt="Releases" src="https://img.shields.io/github/release/vn7n24fzkq/github-profile-summary-cards.svg?style=for-the-badge&logo=semantic-release&color=f5bde6&logoColor=D9E0EE&labelColor=302D41"/></a>
      <a href="https://www.conventionalcommits.org/en/v1.0.0/">
      <img alt="conventionalcommits" src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?style=for-the-badge&logo=conventionalcommits&color=ee99a0&logoColor=D9E0EE&labelColor=302D41"></a>
      <a href="https://github.com/vn7n24fzkq/github-profile-summary-cards/actions/workflows/github-action.yml">
      <img alt="testandlint" src="https://img.shields.io/github/actions/workflow/status/vn7n24fzkq/github-profile-summary-cards/test-and-lint.yml?branch=main&label=Test%20and%20Lint&style=for-the-badge&color=a6da95"></a>
   </p>
</div>

<div align="center">
<p>
<a href="https://github-profile-summary-cards.vercel.app/demo.html">生成你的个人卡片</a>
</p>


![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/0-profile-details.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/1-repos-per-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/2-most-commit-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/3-stats.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/4-productive-time.svg)

</div>

## Themes | 主题

|   |   |   |   |   |
|:---:|:---:|:---:|:---:|:---:|
|default|2077|dracula|github|github_dark|
|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=default)|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=2077)| ![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=dracula)|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=github)|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=github_dark)|
|gruvbox|monokai|nord_bright|nord_dark|radical|
|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=gruvbox)|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=monokai)| ![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=nord_bright)|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=nord_dark)  |![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=radical)|
|solarized|solarized_dark|tokyonight|vue|zenburn|
|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=solarized)|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=solarized_dark)| ![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=tokyonight)|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=vue)  |![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=zenburn)|
|transparent|
|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=transparent)|

[更多主题](https://github.com/vn7n24fzkq/github-profile-summary-cards-example/tree/master/profile-summary-card-output)

## 如何使用 (API)
### 简介摘要卡片
![](http://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=nord_bright)

`http://github-profile-summary-cards.vercel.app/api/cards/profile-details?username={username}&theme={theme_name}`
- 可接收的链接参数
  - theme
    - Theme name
  - username
    - Username
### 仓库首选语言卡片
![](http://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=vn7n24fzkq&theme=nord_bright)

`http://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username={username}&theme={theme_name}&exclude={exclude}`
- 可接收的参数
  - theme
    - Theme name
  - username
    - Username
  - exclude:
    - 排除以逗号分隔的语言列表, e.g., exclude=java,rust,jupyter%20Notebook
      - 当语言中有空格时，使用'%20'来表示.
    - [提供支持的语言](https://github.com/github/linguist/blob/master/lib/linguist/languages.yml)

### 提交首选语言卡片
![](http://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=vn7n24fzkq&theme=nord_bright)

`http://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username={username}&theme={theme_name}&exclude={exclude}`
- 可接收的参数
  - theme
    - Theme name
  - username
    - Username
  - exclude:
    - 排除以逗号分隔的语言列表, e.g., exclude=java,rust,jupyter%20Notebook
      - 当语言中有空格时，使用'%20'来表示
    - [提供支持的语言](https://github.com/github/linguist/blob/master/lib/linguist/languages.yml)

### GitHub 状态卡片
![](http://github-profile-summary-cards.vercel.app/api/cards/stats?username=vn7n24fzkq&theme=nord_bright&)

`http://github-profile-summary-cards.vercel.app/api/cards/stats?username={username}&theme={theme_name}`
- 可接收的参数
  - theme
    - Theme name
  - username
    - Username

### 提交时间表卡片
![](http://github-profile-summary-cards.vercel.app/api/cards/productive-time?username=vn7n24fzkq&theme=nord_bright&utcOffset=8)

`http://github-profile-summary-cards.vercel.app/api/cards/productive-time?username={username}&theme={theme_name}&utcOffset={utcOffset}`
- 可接收的参数
  - theme
  - username
  - utcOffset

---

## 如何使用 (GitHub Actions)

此操作会生成您的GitHub个人资料摘要卡，并提交到您的存储库。添加此操作后，您还可以自己触发操作。

:star: [教程](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Tutorial) ( Recommendation ) :star:

#### 首先

- 你需要正确授权的token | [Personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).
  [Personal token](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Tutorial#generate-token)

- 添加 personal access token 到 repo secret.

#### 使用模版 ( create a repository )

- [github-profile-summary-cards-example](https://github.com/vn7n24fzkq/github-profile-summary-cards-example)

- Action 已经准备就绪, 点击 `use this template button` 创建个人简介.

- 在把 GITHUB_TOKEN 替换为你的 repo secret 之后触发 action ，你可以在 `profile-summary-card-output` 下尽情使用.

#### 添加到已经创建的仓库

- 将此 action 添加到你的仓库， 将你的 GITHUB_TOKEN in action yml file 替换成你的 repo secret.

---

## GitHub Actions 使用方法

在 action 完成之后. 你可以在 `profile-summary-card-output` 看到所有的摘要卡片.

`注意: 一些摘要卡片可能不会及时更新, 因为github原始文件需要缓冲`

```yml
name: GitHub-Profile-Summary-Cards

on:
  schedule: # execute every 24 hours
    - cron: "* */24 * * *"
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    name: generate-github-profile-summary-cards
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4
      - uses: vn7n24fzkq/github-profile-summary-cards@release
        env: # default use ${{ secrets.SUMMARY_GITHUB_TOKEN }}, you should replace with your personal access token
          GITHUB_TOKEN: ${{ secrets.SUMMARY_GITHUB_TOKEN }}
        with:
          USERNAME: ${{ github.repository_owner }}
          # BRANCH_NAME is optional, default to main, branch name to push cards
          BRANCH_NAME: "main"
          # UTC_OFFSET is optional, default to zero
          UTC_OFFSET: 8
          # EXCLUDE is an optional comma seperated list of languages to exclude, defaults to ""
          EXCLUDE: ""
          # AUTO_PUSH is optional, a boolean variable default to true, whether automatically push generated files to desired branch
          AUTO_PUSH: true
```

---

## 本地运行

- 需要 `node 16` 版本, 低版本可能会造成问题.
- 添加 personal access token 到 `.env` 文件. ex: `GITHUB_TOKEN=abcda69ddf66ae95538c5b1666591b59b4abc73a`
- 代码修改完毕后执行 `npm run build` 

```sh
npm run run [username] [UTC offset]
```

例如

```sh
npm run run vn7n24fzkq 8
```

- 可使用 vercel 开发包本地运行API

```sh
vercel dev
```

## 在 Vercel 上部署API
快速部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvn7n24fzkq%2Fgithub-profile-summary-cards&env=GITHUB_TOKEN&envDescription=https%3A%2F%2Fgithub.com%2Fvn7n24fzkq%2Fgithub-profile-summary-cards%23first-step&project-name=my-github-profile-summary-cards)
