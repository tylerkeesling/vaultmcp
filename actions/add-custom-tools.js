/**
 * Initial Handler
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 * @returns
 */
exports.onExecutePostLogin = async (event, api) => {
   if (event.client.client_id === event.secrets.VAULTMCP_CLIENT_ID) {
    // this lists all the custom mcp servers the user has access to.
    const customMcp = (event.user.app_metadata || {}).custom_mcp || [];
    api.idToken.setCustomClaim("custom_mcp", customMcp);
   }
};

// End: Helper Utilities
