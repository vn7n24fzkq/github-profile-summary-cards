# Github Profile Summary Cards

This repo is inspired by [profile-summary-for-github](https://github.com/tipsy/profile-summary-for-github)

This action generate your github profile summary cards and push to your repo.

## Example

![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/profile-details.svg)
![](https://raw.githubusercontent.com/vn7n24fzkq/vn7n24fzkq/master/profile-summary-card-output/solarized/repo-per-language.svg)

## Usage

### `GITHUB_TOKEN`

Default token doesn't has permission for private content, so if you want to calculate private content you will need to use your own secrets.
[Creating and storing encrypted secrets](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets)

After the action finished. You can see the output is push to a folder which named profile-summary-card-output.

`Note: Those cards might not be upadated in time, because github raw file has cache time.`

```ymal
name: GitHub-Profile-Summary-Cards

on:
  schedule: # execute every 3 hours
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
        with:
          USERNAME: ${{ github.repository_owner }}
```

:star: Contributions of any kind welcome! :star:
