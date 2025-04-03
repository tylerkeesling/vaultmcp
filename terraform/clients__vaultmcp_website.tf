resource "auth0_client" "vaultmcp_web" {
  name            = "${var.project_name}_web"
  app_type        = "regular_web"
  is_first_party  = true


  callbacks       = [var.app_callback_url]
  allowed_logout_urls = [var.app_base_url]
  
  oidc_conformant = true

  jwt_configuration {
    alg = "RS256"
  }

  grant_types = [
    "authorization_code", 
    "refresh_token",
    "client_credentials",
    "urn:openid:params:grant-type:ciba",
    "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token"
  ]
}


resource "auth0_client_grant" "vaultmcp_site_m2m_grant" {
  client_id = auth0_client.vaultmcp_web.client_id
  audience  = "https://${var.auth0_domain}/api/v2/"

  scopes = [
    "update:users",
    "read:users",
    "read:federated_connections_tokens",
    "delete:federated_connections_tokens",
    "read:connections",
    "create:connections"
  ]
}
