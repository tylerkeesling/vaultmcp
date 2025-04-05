resource "auth0_action" "add_custom_tools" {
  name         = "Add Custom Tools"

  deploy = true

  secrets {
    name  = "VAULTMCP_CLIENT_ID"
    value = auth0_client.vaultmcp_web.client_id
  }


  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  code         = file("${path.module}/../actions/add-custom-tools.js")
  runtime      = "node22"
}

# Attach to the Login Flow
resource "auth0_trigger_action" "add_custom_tools_binding" {
  trigger = "post-login"
  action_id = auth0_action.client_initiated_account_linking.id
}
