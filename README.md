<div align="center">
   <h1>GitHub Profile Summary Cards</h1>


   [繁體中文](./docs/README.zh-tw.md)
   <p>
      A tool to generate your github summary card for profile README. Inspired by <a href=https://github.com/tipsy/profile-summary-for-github>profile-summary-for-github</a>
   </p>
   <p>
      :star: This repo is just for fun, feel free to contribute! :star:
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
<a href="https://github-profile-summary-cards.vercel.app/demo.html">Get your own cards now!!</a>
</p>


![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/0-profile-details.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/1-repos-per-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/2-most-commit-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/3-stats.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/4-productive-time.svg)

</div>

## Themes

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

[More themes](https://github.com/vn7n24fzkq/github-profile-summary-cards-example/tree/master/profile-summary-card-output)

## How to use (API)
### Profile details card
![](http://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=vn7n24fzkq&theme=nord_bright)

`http://github-profile-summary-cards.vercel.app/api/cards/profile-details?username={username}&theme={theme_name}`
- Accept url parameters
  - theme
    - Theme name
  - username
    - Username
### Top languages used in repository card
![](http://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=vn7n24fzkq&theme=nord_bright)

`http://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username={username}&theme={theme_name}&exclude={exclude}`
- Accept url parameters
  - theme
    - Theme name
  - username
    - Username
  - exclude:
    - A comma separated list of languages to exclude, e.g., exclude=java,rust
    - You can found the supported languages in [here](https://github.com/github/linguist/blob/master/lib/linguist/languages.yml)

### Top languages in commits card
![](http://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=vn7n24fzkq&theme=nord_bright)

`http://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username={username}&theme={theme_name}&exclude={exclude}`
- Accept url parameters
  - theme
    - Theme name
  - username
    - Username
  - exclude:
    - A comma separated list of languages to exclude, e.g., exclude=java,rust
    - You can found the supported languages in [here](https://github.com/github/linguist/blob/master/lib/linguist/languages.yml)

### GitHub stats card
![](http://github-profile-summary-cards.vercel.app/api/cards/stats?username=vn7n24fzkq&theme=nord_bright&)

`http://github-profile-summary-cards.vercel.app/api/cards/stats?username={username}&theme={theme_name}`
- Accept url parameters
  - theme
    - Theme name
  - username
    - Username

### Productive time card
![](http://github-profile-summary-cards.vercel.app/api/cards/productive-time?username=vn7n24fzkq&theme=nord_bright&utcOffset=8)

`http://github-profile-summary-cards.vercel.app/api/cards/productive-time?username={username}&theme={theme_name}&utcOffset={utcOffset}`
- accept url parameters
  - theme
  - username
  - utcOffset

---

## How to use (GitHub Actions)

This action generate your github profile summary cards and make a commit to your repo.
You can also trigger action by yourself after add this action.

:star: [Follow tutorial](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Tutorial) ( Recommendation ) :star:

#### First step

- You need create a [Personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) with correct permissions.
  [Personal token](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Tutorial#generate-token)

- Add personal access token to repo secret.

#### Use template ( create a repository )

- [github-profile-summary-cards-example](https://github.com/vn7n24fzkq/github-profile-summary-cards-example)

- Action already setup in this template, you just need click `use this template button` to create your profile readme.

- After replace GITHUB_TOKEN with your repo secret and trigger action you can use everything in `profile-summary-card-output` folder.

#### Add to exist repository

- Add this action to repo and replace GITHUB_TOKEN in action yml file with your repo secret.

---

## GitHub Actions usage

After the action finished. You can see all of summary cards are in folder which named `profile-summary-card-output`.

`Note: Some summary cards might not be updated in time, because github raw file has cache time.`

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

## Local Run

- Require `node 16`, lower versions should get some problems.
- Add personal access token to `.env` file. ex: `GITHUB_TOKEN=abcda69ddf66ae95538c5b1666591b59b4abc73a`
- Remember `npm run build` after modifying any code

```sh
npm run run [username] [UTC offset]
```

Example

```sh
npm run run vn7n24fzkq 8
```

- To locally run the API you can use the vercel dev package

```sh
vercel dev
```

## Deploy your own API on Vercel
Quickly deploy your own version!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvn7n24fzkq%2Fgithub-profile-summary-cards&env=GITHUB_TOKEN&envDescription=https%3A%2F%2Fgithub.com%2Fvn7n24fzkq%2Fgithub-profile-summary-cards%23first-step&project-name=my-github-profile-summary-cards)
