# GitHub Profile Summary Cards

![Unit Tests](https://github.com/vn7n24fzkq/github-profile-summary-cards/workflows/Unit%20Tests/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vn7n24fzkq/github-profile-summary-cards/blob/master/LICENSE)
![release](https://img.shields.io/github/v/release/vn7n24fzkq/github-profile-summary-cards.svg)

[繁體中文](./docs/README.zh-tw.md)

This repo is inspired by [profile-summary-for-github](https://github.com/tipsy/profile-summary-for-github)

This action generate your github profile summary cards and push to your repo.
You can also trigger action by yourself after add this action.

`After you add this to your workflow, your should trigger the workflow then you can use those cards immediately.`

| :warning: | If your workflow does not generate all cards in output folder, then you need to use [Personal access token](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) instead of GITHUB_TOKEN in workflow.  |
| :-------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

[Creating a personal access token
](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

[Personal token permissions](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Personal-access-token-permissions)


---

## Example

![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/0-profile-details.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/1-repos-per-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/2-most-commit-language.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/3-stats.svg)

[More example with themes](https://github.com/vn7n24fzkq/github-profile-summary-cards-example/tree/master/profile-summary-card-output)

---

## Use template

[github-profile-summary-cards-example](https://github.com/vn7n24fzkq/github-profile-summary-cards-example)

Action already setup In this template, you just need click `use this template button` to create your repo and wait for workflow to finish.

Then you can use everything in `profile-summary-card-output` folder.

---

## Wiki

[Add to my profile README](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Add-to-my-profile-README) (For those who don't familiar with github action)

---

## GitHub Actions usage

### `GITHUB_TOKEN`

| :warning: | If you get this error`Error: Resource not accessible by integration` then you need to use [Personal access token](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) instead of GITHUB_TOKEN . |
| :-------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |


Default token doesn't has permission for private content, so if you want to calculate private content you will need to use [Personal access token](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets).

After the action finished. You can see the output is push to a folder which named `profile-summary-card-output`.

`Note: Those cards might not be upadated in time, because github raw file has cache time.`

```yml
name: GitHub-Profile-Summary-Cards

on:
  schedule: # execute every 24 hours
    - cron: "* */24 * * *"
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    name: generate

    steps:
      - uses: actions/checkout@v2
      - uses: vn7n24fzkq/github-profile-summary-cards@release
        env: # default use ${{ secrets.GITHUB_TOKEN }}, you can change to your personal access token
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          USERNAME: ${{ github.repository_owner }}
```

---

## Local Run

- I build this on `node 12`, lower version should get some problems.
- Add GITHUB_TOKEN to `.env` file. ex:`GITHUB_TOKEN=abcda69ddf66ae95538c5b1666591b59b4abc73a`

```
npm install
```

```
npm run run [username]
```

:star: This repo just for fun, feel free to contribution! :star:
