const getContributionByYear = require("../../src/github-api/contributions-by-year");
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const mock = new MockAdapter(axios);

const data = {
  data: {
    user: {
      contributionsCollection: {
        totalIssueContributions: 20,
        totalCommitContributions: 30,
        totalRepositoryContributions: 40,
        totalPullRequestContributions: 50,
        totalPullRequestReviewContributions: 60,
        contributionCalendar: {
          totalContributions: 10,
        },
      },
    },
  },
};

const error = {
  errors: [
    {
      type: "NOT_FOUND",
      path: ["user"],
      locations: [],
      message: "GitHub api failed",
    },
  ],
};

afterEach(() => {
  mock.reset();
});

describe("contributions count on github", () => {
  it("should get correct contributions", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data);
    let totalContributions = await getContributionByYear("vn7n24fzkq", 2020);
    expect(totalContributions).toStrictEqual({
      totalPullRequestReviewContributions:60,
      totalPullRequestContributions: 50,
      totalRepositoryContributions: 40,
      totalCommitContributions: 30,
      totalIssueContributions: 20,
      totalContributions: 10,
    });
  });

  it("should throw error when api failed", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, error);
    await expect(getContributionByYear("vn7n24fzkq", 2020)).rejects.toThrow(
      "GitHub api failed"
    );
  });
});
