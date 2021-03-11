# GitHub Profile Summary Cards

This repo is inspired by [profile-summary-for-github](https://github.com/tipsy/profile-summary-for-github)

![Unit Tests](https://github.com/vn7n24fzkq/github-profile-summary-cards/workflows/Unit%20Tests/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards/blob/master/LICENSE)
![release](https://img.shields.io/github/v/release/vn7n24fzkq/github-profile-summary-cards.svg)

[繁體中文](./docs/README.zh-tw.md)

:star: This repo just for fun, feel free to contribution! :star:

This action generate your github profile summary cards and make a commit to your repo.
You can also trigger action by yourself after add this action.

---

## Example

![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/0-profile-details.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/1-repos-per-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/2-most-commit-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/3-stats.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/4-productive-time.svg)

[More themes](https://github.com/vn7n24fzkq/github-profile-summary-cards-example/tree/master/profile-summary-card-output)

---

## How to use

:star: [Follow tutorial](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Toturial) ( Recommendation ) :star:

#### First step

- You need create a [Personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) with correct permissions.
  [Personal token permissions](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Personal-access-token-permissions)

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

    steps:
      - uses: actions/checkout@v2
      - uses: vn7n24fzkq/github-profile-summary-cards@release
        env: # default use ${{ secrets.GITHUB_TOKEN }}, you should replace with your personal access token
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          USERNAME: ${{ github.repository_owner }}
```

---

## Local Run

- I build this on `node 12`, lower version should get some problems.
- Add personal access token to `.env` file. ex:`GITHUB_TOKEN=abcda69ddf66ae95538c5b1666591b59b4abc73a`

```
npm run run [username]
```
