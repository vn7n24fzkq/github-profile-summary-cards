# Github Profile Summary Cards

This action generate your github profile summary cards and push to your repo.

## Outputs

Github profile summary cards.

![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/profile-details.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/repo-per-language.svg)

## Example usage

```ymal
name: GitHub-Profile-Summary-Cards
description: Generate profile summary cards and commit to default branch

on:
  schedule:
    - cron: '* */3 * * *'
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
```
