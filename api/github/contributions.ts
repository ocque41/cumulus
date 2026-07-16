import { createGithubContributionsHandler } from "../../server/github/handler.js";

const handler = createGithubContributionsHandler({ env: process.env });

export default {
  fetch(request: Request): Promise<Response> {
    return handler(request);
  },
};
