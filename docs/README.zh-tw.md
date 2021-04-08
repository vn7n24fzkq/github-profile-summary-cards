# GitHub Profile Summary Cards

這份專案受到 [profile-summary-for-github](https://github.com/tipsy/profile-summary-for-github) 啟發

![Unit Tests](https://github.com/vn7n24fzkq/github-profile-summary-cards/workflows/Unit%20Tests/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards/blob/master/LICENSE)
![release](https://img.shields.io/github/v/release/vn7n24fzkq/github-profile-summary-cards.svg)

[繁體中文](./docs/README.zh-tw.md)

:star: 這份 repo 是好玩才寫的,任何貢獻都很歡迎！ :star:

---

## Markdown 用法

[馬上試試!!](https://github-profile-summary-cards.vercel.app/demo.html)

```![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=vue)```

|   |   |   |
|:---:|:---:|:---:|
|default|solarized|monokai|
|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=default)|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=solarized)| ![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=monokai)|
|solarized_dark|vue|nord_bright|
|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=solarized_dark)|![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=vue)| ![](https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=nord_bright)|


## 範例

![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/0-profile-details.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/1-repos-per-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/2-most-commit-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/3-stats.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/4-productive-time.svg)

[更多主題](https://github.com/vn7n24fzkq/github-profile-summary-cards-example/tree/master/profile-summary-card-output)

---

## 如何使用 (GitHub Actions)

這個 GitHub Action 會產生你的 GitHub 個人統計圖表並且 commit 到你的 repo 裡.
新增 這個Action 之後你也可以自己觸發 action.

:star: [跟著教學](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Toturial) ( 推薦 ) :star:

#### 第一步

- You need create a [Personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) with correct permissions.
  [Personal token permissions](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Personal-access-token-permissions)

- Add personal access token to repo secret.

#### 使用模板 ( 創建一個儲存庫 )

- [github-profile-summary-cards-example](https://github.com/vn7n24fzkq/github-profile-summary-cards-example)

- Action 已經在這個模板裡設定好了, 你只需要按下 `use this template button` 來創建你的 profile readme.

- 用你儲存庫裡的 secret 來更換 action yml 檔案裡的 GITHUB_TOKEN 並且觸發 action 後你就可以使用所有在 `profile-summary-card-output` 資料夾底下的東西.

#### 新增到現有的儲存庫

- 新增這個 action 到儲存庫,並且用你儲存庫裡的 secret 來更換 action yml 檔案裡的 GITHUB_TOKEN.

---

## GitHub Actions 使用方法

在 action 完成之後. 你可以看到所有東西都在名稱為 `profile-summary-card-output` 的資料夾底下.

`筆記: 所有卡片可能不會立即更新,因為 github raw file 有做 cache`

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

    steps:
      - uses: actions/checkout@v2
      - uses: vn7n24fzkq/github-profile-summary-cards@release
        env: # default use ${{ secrets.GITHUB_TOKEN }}, you should replace with your personal access token
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          USERNAME: ${{ github.repository_owner }}
```

---

## 本地執行

- 建立環境是 `node 12`, 較低版本可能會出錯。
- 新增 GITHUB_TOKEN 到 `.evn` 檔案裡。 ex:`GITHUB_TOKEN=abcda69ddf66ae95538c5b1666591b59b4abc73a`

```
npm run run [username]
```
