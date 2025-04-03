resource "auth0_client" "client_initiated_account_linking" {
  name            = "Client Initiated Account Linking Action"
  app_type        = "non_interactive"
  is_first_party  = true

  callbacks       = ["${var.issuer_url}/continue"]

  oidc_conformant = true

  jwt_configuration {
    alg = "RS256"
  }

  grant_types = ["authorization_code", "refresh_token", "client_credentials"]
}


resource "auth0_client_grant" "action_m2m_grant" {
  client_id = auth0_client.client_initiated_account_linking.client_id
  audience  = "https://${var.auth0_domain}/api/v2/"

  scopes = [
    "update:users"
  ]
}

data "auth0_client" "client_initiated_account_linking" {
  client_id = auth0_client.client_initiated_account_linking.client_id
}