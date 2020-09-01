const getContributionByYear = require("../../src/github-api/contributions-by-year");
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const mock = new MockAdapter(axios);

const data = {
  data: {
    user: {
      contributionsCollection: {
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
      message: "Github api failed",
    },
  ],
};

afterEach(() => {
  mock.reset();
});

describe("github api for profile details", () => {
  it("should get correct profile data", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data);
    let totalContributions = await getContributionByYear("vn7n24fzkq", 2020);
    expect(totalContributions).toStrictEqual({
      totalContributions: 10,
    });
  });

  it("should throw error when api failed", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, error);
    await expect(getContributionByYear("vn7n24fzkq", 2020)).rejects.toThrow(
      "Github api failed"
    );
  });
});
