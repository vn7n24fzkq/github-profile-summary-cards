# Github Profile Summary Cards

![Unit Tests](https://github.com/vn7n24fzkq/github-profile-summary-cards/workflows/Unit%20Tests/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards/blob/master/LICENSE)
![release](https://img.shields.io/github/v/release/vn7n24fzkq/github-profile-summary-cards.svg)

這份專案受到 [profile-summary-for-github](https://github.com/tipsy/profile-summary-for-github) 啟發

這個 action 會自動產生所有卡片,然後 push 到 repo 底下的 profile-summary-card-output 資料夾底下。
你也可以自己觸發 workflow

`剛新增這個 github action 的 repo, 要立即使用的話需要自己觸發一次`

---

## 範例

![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/0-profile-details.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/1-repos-per-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/2-most-commit-language.svg)

[更多範例以及主題](https://github.com/vn7n24fzkq/github-profile-summary-cards-example/tree/master/profile-summary-card-output)

---

## 使用模板

[github-profile-summary-cards-example](https://github.com/vn7n24fzkq/github-profile-summary-cards-example)

Action 已經在這份模板裡設定好了, 你只要按一下 `use this template` 就可以使用在一份新的 repo 裡, 剛建立完 repo 會需要等一下 workflow 執行.

所有東西就放在 `profile-summary-card-output` 底下.

---

## Wiki

[Add to my profile README](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Add-to-my-profile-README) （給那些不熟悉 github aciont 的人)

---

## Github action usage

### `GITHUB_TOKEN`

如果 github action 遇到這個錯誤`Error: Resource not accessible by integration` 那你就需要用 [Personal access token](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) 當 GITHUB_TOKEN.

預設的 token 沒有私有的權限, 如果你想計算私有數據的話就需要使用 [Personal access token](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets).

Action 結束之後,所有輸出都會在 `profile-summary-card-output` 資料夾底下。

`筆記: 所有卡片可能不會立即更新,因為 github raw file 有做 cache.`

```ymal
name: GitHub-Profile-Summary-Cards

on:
  schedule: # execute every 24 hours
    - cron: '* */24 * * *'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    name: generate

    steps:
      - uses: actions/checkout@v2
      - uses: vn7n24fzkq/github-profile-summary-cards@release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          USERNAME: ${{ github.repository_owner }}
```

---

## Local Run

- 建立環境是 `node 12`, 較低版本可能會出錯。
- 新增 GITHUB_TOKEN 到 `.evn` 檔案裡。 ex:`GITHUB_TOKEN=abcda69ddf66ae95538c5b1666591b59b4abc73a`

```
npm install
```

```
npm run run [username]
```

:star: 這份 repo 是好玩才寫的,任何貢獻都很歡迎！ :star:
