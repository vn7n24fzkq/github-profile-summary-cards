# GitHub Profile Summary Cards

這份專案受到 [profile-summary-for-github](https://github.com/tipsy/profile-summary-for-github) 啟發

![Test and Lint](https://github.com/vn7n24fzkq/github-profile-summary-cards/workflows/Test%20and%20Lint/badge.svg)
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

## 組織卡片 (Organization cards)

所有 API 端點和 GitHub Action 都會自動偵測 `username` 是個人帳號還是組織帳號,不需要額外的參數。

當 login 對應到一個組織時,同樣的 URL 會回傳組織版本的卡片:
- `profile-details` 會把 contributions 圖表替換成 "repos created over time",並顯示 Members / Public Repos / Created at / Email|Location|Website。
- `repos-per-language` 和 `most-commit-language` 會聚合整個組織的公開 repos(commit 卡片限制在前 50 個 repos 以避免超過 API rate limit)。
- `stats` 顯示 Total Stars / Total Repos / Total Forks / Members / Open Issues。
- `productive-time` **不支援組織**(因為它依賴個人的 contribution 資料);此端點會回傳一張說明用的錯誤卡片。

組織模式下,`profile-summary-card-output/` 每個主題會產生 4 張卡片(沒有 productive-time)。

---

## 設定 GitHub Token

無論是本地執行、GitHub Action 還是 Vercel,都需要一組 GitHub 的 Personal Access Token (PAT)。如果你從來沒有產生過 token,請先看這一節。

### Token 是誰的?

**PAT 永遠屬於使用者帳號,而非組織帳號。** 即使你用這個工具來生成某個組織(例如 `microsoft`)的卡片,token 仍然是從一個*使用者*產生的 — 通常就是你。Token 只擁有*那位使用者*本身擁有的存取權。卡片顯示的都是公開資料,所以任何登入過 GitHub 的使用者帳號產生的 token 都可以使用。

如果你想為你身為成員的私有組織產生卡片,token 還是要在你的*個人帳號*下產生,只需要授權它讀取那個組織(請看下面的 scope 設定)。

### 步驟 1:選擇 token 類型

GitHub 提供兩種 PAT 樣式,兩種都可以用在這個專案。

- **Fine-grained PAT**(推薦)。較新,可以針對特定 repo 或組織授權,強制要求設定到期日。
  建立網址:https://github.com/settings/personal-access-tokens/new。
- **Classic PAT**。較舊,scope 較粗略,到期日可選。
  建立網址:https://github.com/settings/tokens/new。

### 步驟 2:授予正確的權限

**公開**的使用者和組織(最常見的情況)需要的權限非常少:

| Token 類型 | 需要勾選 |
|---|---|
| Fine-grained PAT | **Repository access**:選 "Public repositories (read-only)"。**Account permissions**:保留預設值 — 公開個人資料不需要明確授權。若目標是組織,把 "Resource owner" 設為該組織。 |
| Classic PAT | 勾選 `public_repo` 和 `read:user`。如果要讀取*私有*組織的成員數,加上 `read:org`。 |

針對**私有** repo 或私有組織成員,權限需要再增加:

| Token 類型 | 需要勾選 |
|---|---|
| Fine-grained PAT | "Repository access":選 "All repositories" 或指定特定的私有 repo。Read-only 已足夠。 |
| Classic PAT | 加上 `repo`(完整 repo 存取)和 `read:org`。 |

請務必設定到期日(90 天是合理的預設值)並馬上複製 token — GitHub 只會顯示一次。

### 步驟 3:把 token 放到對的位置

Token 放在哪取決於你怎麼執行這個工具。同一組 token,不同的存放位置。

#### 本地開發 (`npm run test:local` 或 `vercel dev`)

把 `.env.example` 複製成專案根目錄下的 `.env`,然後貼上你的 token:

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

`.env` 已經寫在 [.gitignore](../.gitignore) 裡 — 千萬不要 commit 它。`npm run test:local` 和 `vercel dev` 都會自動載入這個檔案。

#### GitHub Actions(在你的個人 profile repo 上自動更新卡片)

到**將要執行 workflow 的那個 repo** — 通常是 `https://github.com/<你的帳號>/<你的帳號>` — 然後:

1. 點 **Settings** → **Secrets and variables** → **Actions**。
2. 點 **New repository secret**。
3. 命名為 `SUMMARY_GITHUB_TOKEN`(下面範例 workflow 引用的名字)。
4. 貼上 token 然後儲存。

Workflow yaml 用 `${{ secrets.SUMMARY_GITHUB_TOKEN }}` 引用這個 secret。**永遠不要**把原始 token 貼到 yaml 裡。

如果你想讓 bot 把產生的卡片 push 回 repo,secret 必須是你的 PAT,**不是** GitHub 自動提供的 `GITHUB_TOKEN` — 內建的 token 在 schedule cron 觸發時無法 push。

#### Vercel(部署你自己的 API)

在你的 Vercel 專案中:**Settings** → **Environment Variables** → **Add**。

- **Key**:`GITHUB_TOKEN`
- **Value**:貼上 token
- **Environments**:Production、Preview、Development 都勾選。

存檔後重新部署,新環境變數才會生效。

### 常見錯誤

- **不小心 commit token**。如果 `.env` 出現在 `git status` 裡,先停下來 — 確認 `.gitignore` 有正確忽略它。如果已經 push 含有 token 的 commit,馬上到 https://github.com/settings/tokens 撤銷它,然後產生新的。
- **在 Action 裡使用 `${{ secrets.GITHUB_TOKEN }}`(內建 token)**。Schedule cron 觸發時內建 token 沒辦法 push。要用你自己的 PAT,放在自訂名稱的 secret 下。
- **想在組織帳號下產生 token**。沒有這種選項 — GitHub 不發 PAT 給組織。永遠是從個人帳號的 `Settings → Developer settings` 產生。
- **缺少 `read:org` scope** 但又想讀取私有組織的成員數。組織的 `membersWithRole.totalCount` 會回傳 0 或報錯,加上 scope 後重新產生 token。

---

## 如何使用 (GitHub Actions)

這個 GitHub Action 會產生你的 GitHub 個人統計圖表並且 commit 到你的 repo 裡.
新增 這個Action 之後你也可以自己觸發 action.

:star: [跟著教學](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Toturial) ( 推薦 ) :star:

#### 第一步

- 產生一組 Personal access token,加為名為 `SUMMARY_GITHUB_TOKEN` 的 repo secret。如果你從來沒做過,請看上面的[設定 GitHub Token](#設定-github-token) — 那一節有完整的步驟、權限說明、以及 secret 該放在哪裡的指引。
- 進一步的設定參考,請看專案的 [wiki 教學](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Tutorial#generate-token)(有截圖)。

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
```

---

## 本地執行

- 要求 `node 16`, 較低版本可能會出錯。
- 新增 GITHUB_TOKEN 到 `.evn` 檔案裡。 ex:`GITHUB_TOKEN=abcda69ddf66ae95538c5b1666591b59b4abc73a`
- 修改之後記得要 ```npm run build```

```
npm run run [username] [UTC offset]
```

範例
```
npm run run vn7n24fzkq 8
```
