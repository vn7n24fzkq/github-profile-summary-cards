## IMPORTANT! <br>

This is LEGACY Version, New updated wiki can be found [Here.](https://github.com/vn7n24fzkq/github-profile-summary-cards/wiki/Tutorial)

---
### First step

|          We create a Personal access token with permissions we need           |
| :---------------------------------------------------------------------------: |
|                              1. Find `Settings`                               |
|        <img src="./assets_legacy/find-setting.png" height="520" width="360">         |
|                         2. Find `Developer Settings`                          |
|   <img src="./assets_legacy/find-developer-settings.png" height="500" width="360">   |
|                       3. Find `Personal access tokens`                        |
| <img src="./assets_legacy/find-personal-access-tokens.png" height="200" width="400"> |
|                     4. Press `Generate new token` button                      |
|     <img src="./assets_legacy/generate-new-token.png" height="220" width="900">      |
|                5. Type access token name and check permissions                |
|        <img src="./assets_legacy/create-token.png" height="520" width="380">         |
|             6. Scroll to bottom and press `Generate token` button             |
|   <img src="./assets_legacy/generate-token-button.png" height="200" width="400">>    |
|     7. Then we get the token, copy the token value, we will use it later      |
|                      ![](./assets_legacy/copy-token-value.png)                       |

---

### Add to repo

- If you want create a Profile README or create a new repository. [Next Step](#use-template)

- If you want add to a exist repository. [Next Step](#add-personal-access-token-to-repo)

---

### Use template

|                   Open template page [github-profile-summary-cards-example](https://github.com/vn7n24fzkq/github-profile-summary-cards-example)                   |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                             Find and press `Use this template` button                                                             |
|                                               <img src="./assets_legacy/press-use-template.png" height="300" width="720">                                                |
| Type repository name then press `Create repository from template` button (If you want to create a Profile README repository then the name should be you username) |
|                                                 <img src="./assets_legacy/type-repo-name.png" height="300" width="500">                                                  |
|                                                                   Now we have a new repository                                                                    |
|                                                    <img src="./assets_legacy/new-repo.png" height="300" width="600">                                                     |

[Next Step](#add-personal-access-token-to-repo)

---

### Add Github Action to repo

|           We are gonna use the personal token we early copy            |
| :--------------------------------------------------------------------: |
|                    Find and click `Add file` button                    |
|  <img src="./assets_legacy/where-is-add-file.png" height="250" width="900">   |
| Type file name with path `.github/workflows/profile-summary-cards.yml` |
|    <img src="./assets_legacy/type-file-name.png" height="250" width="840">    |
|                       Copy and paste to the file                       |

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
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          USERNAME: ${{ github.repository_owner }}
```

|                 It should looks like this one                 |
| :-----------------------------------------------------------: |
|  <img src="./assets_legacy/new-file.png" height="800" width="700">   |
|                      Then we commit file                      |
| <img src="./assets_legacy/commit-file.png" height="400" width="500"> |

[Next Step](#add-personal-access-token-to-repo)

---

### Add Personal access token to repo

|                                   We are gonna use the personal token we early copy                                   |
| :-------------------------------------------------------------------------------------------------------------------: |
|                                             Find `Settings` in repository                                             |
|                         <img src="./assets_legacy/find-repo-settings.png" height="300" width="750">                          |
|                                          Find secrets in repository settings                                          |
|                            <img src="./assets_legacy/find-secrets.png" height="500" width="400">                             |
| Now, we type secret name you want and paste the personal access token as secret Value, then press `Add secret` button |
|                     <img src="./assets_legacy/type-token-and-token-value.png" height="300" width="600">                      |
|                                              It should has a secret here                                              |
|                           <img src="./assets_legacy/secret-preview.png" height="350" width="650">                            |

[Next Step](#change-github-action-token)

---

### Change Github Action token

|                         We are almost done!                          |
| :------------------------------------------------------------------: |
|                Find the github action file just added                |
| <img src="./assets_legacy/find-workflow-file.png" height="350" width="650"> |
|                      And we do some modify this                      |
| <img src="./assets_legacy/edit-workflow-file.png" height="500" width="950"> |
|       Replace default GITHUB_TOKEN with the secret we jsut add       |
|     <img src="./assets_legacy/old-secret.png" height="450" width="950">     |
|                           With new secret                            |
|    <img src="./assets_legacy/new-secrect.png" height="450" width="950">     |
|                          Commit this change                          |
|   <img src="./assets_legacy/commit-secret.png" height="450" width="950">    |

[Next Step](#trigger-action)

### Trigger action

|               Now the action should automatically start                |
| :--------------------------------------------------------------------: |
|                       We can check workflow runs                       |
|   <img src="./assets_legacy/where-is-action.png" height="350" width="650">    |
|                         Run workflow manually                          |
|     <img src="./assets_legacy/run-workflow.png" height="350" width="850">     |
| Wait workflow finish (You need to refresh page to see latest workflow) |
|     <img src="./assets_legacy/run-workflow.png" height="350" width="850">     |

[Next Step](#everything-are-finished!)

---

### Everything are finished!

|          We can see all cards of each themes 🎉          |
| :------------------------------------------------------: |
|  Check profile-summary-card-output folder in your repo   |
| <img src="./assets_legacy/output.png" height="550" width="650"> |
|                   :star: Finish :star:                   |
| <img src="./assets_legacy/finish.png" height="550" width="650"> |
