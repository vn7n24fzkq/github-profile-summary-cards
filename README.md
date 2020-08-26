# Github Profile Summary Cards

This action generate your github profile summary cards and push to your repo.

## Outputs

Github profile summary cards.


## Example usage

```ymal
name: CI

on:
  schedule:
    - cron: '* */3 * * *'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    name: test

    steps:
      - uses: actions/checkout@v2
      - uses: vn7n24fzkq/github-profile-summary-cards@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CONTAIN_PRAIVTE: 1
```
