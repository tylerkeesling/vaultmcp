
import { tool } from "ai";
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { getGithubToken } from "./get-github-token";

// tool to Fetch user details for the authenticated user
export const get_user_details = tool({
    description: 'Get user details from GitHub',
    parameters: z.object({}),
    execute: async () => {
        try {

            const octokit = new Octokit({
                auth: await getGithubToken(),
            });

            const response = await octokit.request('GET /user');
            return response.data;
        } catch (error) {
            console.error('Error fetching user details:', error);
            throw new Error('Failed to fetch user details');
        }
    },
});
