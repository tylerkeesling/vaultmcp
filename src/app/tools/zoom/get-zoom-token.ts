import { getTokenFromVault } from '@/lib/auth0';


export const ZOOM_CONNECTION_NAME = "zoom";

export async function getZoomToken() {
    const zt = await getTokenFromVault({
        connection: ZOOM_CONNECTION_NAME
    });
    
    return zt;
}

