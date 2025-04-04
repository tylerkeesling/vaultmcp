import { tool } from "ai";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { getGithubToken } from "./get-github-token";

export const get_repo_settings = tool({
  description: "Fetch basic settings and collaborators for a GitHub repo",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  execute: async ({ owner, repo }) => {
    const octokit = new Octokit({ auth: await getGithubToken() });

    const [repoSettings, collaborators] = await Promise.all([
      octokit.repos.get({ owner, repo }),
      octokit.repos.listCollaborators({ owner, repo }),
    ]);

    return {
      name: repoSettings.data.name,
      private: repoSettings.data.private,
      visibility: repoSettings.data.visibility,
      default_branch: repoSettings.data.default_branch,
      collaborators: collaborators.data.map((c) => ({
        login: c.login,
        role: c.role_name,
        permissions: c.permissions,
      })),
    };
  },
});

export const list_repo_files = tool({
  description: "List files in a GitHub repository at a specific branch or path",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    path: z.string().optional(),
    ref: z.string().optional(),
  }),
  execute: async ({ owner, repo, path = "", ref }) => {
    const octokit = new Octokit({ auth: await getGithubToken() });

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    return Array.isArray(response.data)
      ? response.data.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type,
          size: item.size,
        }))
      : response.data;
  },
});

export const list_issues = tool({
  description: "List issues for a GitHub repository",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    state: z.enum(["open", "closed", "all"]).optional(),
  }),
  execute: async ({ owner, repo, state = "open" }) => {
    const octokit = new Octokit({ auth: await getGithubToken() });

    const response = await octokit.issues.listForRepo({
      owner,
      repo,
      state,
    });

    return response.data.map((issue) => ({
      id: issue.id,
      title: issue.title,
      state: issue.state,
      created_at: issue.created_at,
      user: issue.user?.login,
    }));
  },
});

export const list_pull_requests = tool({
  description: "List pull requests for a GitHub repository",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    state: z.enum(["open", "closed", "all"]).optional(),
  }),
  execute: async ({ owner, repo, state = "open" }) => {
    const octokit = new Octokit({ auth: await getGithubToken() });

    const response = await octokit.pulls.list({
      owner,
      repo,
      state,
    });

    return response.data.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      user: pr.user?.login,
      created_at: pr.created_at,
      merged_at: pr.merged_at,
    }));
  },
});

// tool to fetch repos for the authenticated user
export const get_user_repos = tool({
  description: "Get user repos from GitHub",
  parameters: z.object({}),
  execute: async () => {
    try {
      const octokit = new Octokit({
        auth: await getGithubToken(),
      });

      const response = await octokit.request("GET /user/repos", {
        visibility: "all",
      });
      const filteredRepos = response.data.map((repo) => ({
        id: repo.id,
        full_name: repo.full_name,
        private: repo.private,
        owner_name: repo.owner.login,
        url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
      }));

      console.log(filteredRepos);
      return filteredRepos;
    } catch (error) {
      console.error("Error fetching user repos:", error);
      throw new Error("Failed to fetch user repos");
    }
  },
});
