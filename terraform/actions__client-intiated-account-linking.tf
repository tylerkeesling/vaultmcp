resource "auth0_action" "client_initiated_account_linking" {
  name         = "Client Initiated Account Linking"

  deploy = true

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  code         = file("${path.module}/../actions/client-initiated-account-linking.js")
  runtime      = "node22"

  dependencies {
    name = "jose"
    version = "6.0.10"
  }

  dependencies {
    name = "debug"
    version = "4.4.0"
  }

  dependencies {
    name = "auth0"
    version = "4.21.0"
  }

  dependencies {
    name="@panva/hkdf"
    version="1.2.1"
  }

  dependencies {
    name="openid-client"
    version="6.3.4"
  }

  secrets {
    name  = "AUTH0_DOMAIN"
    value = var.auth0_domain
  }

  secrets {
    name  = "AUTH0_CLIENT_ID"
    value = auth0_client.client_initiated_account_linking.client_id
  }
  
  secrets {
    name  = "AUTH0_CLIENT_SECRET"
    value = data.auth0_client.client_initiated_account_linking.client_secret
  }

  secrets {
    name  = "ACTION_SECRET"
    value = var.action_secret
  }

  secrets {
    name  = "DEBUG"
    value = "account-linking:error"
  }

  secrets {
    name  = "ENFORCE_MFA"
    value = "yes"
  }

  secrets {
    name  = "ENFORCE_EMAIL_VERIFICATION"
    value = "yes"
  }
  
  secrets {
    name  = "PIN_IP_ADDRESS"
    value = "no"
  }
}

# Attach to the Login Flow
resource "auth0_trigger_action" "client_initiated_account_linking_binding" {
  trigger = "post-login"
  action_id = auth0_action.client_initiated_account_linking.id
}
