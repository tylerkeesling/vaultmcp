import { getTokenFromVault } from '@/lib/auth0';


export const GITHUB_CONNECTION_NAME = "github";

export async function getGithubToken() {
    const ghToken = await getTokenFromVault({
        connection: GITHUB_CONNECTION_NAME
    });
    
    return ghToken;
}

