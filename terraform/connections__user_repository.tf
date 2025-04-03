resource "auth0_connection" "primary_account" {
  is_domain_connection = true

  name     = "${var.project_name}-users"
  strategy = "auth0"

  options {
    strategy_version = 2
    password_policy = "excellent"
    brute_force_protection = true

    attributes {
      email {
        profile_required = true
        identifier {
          active = true
        }
        verification_method = "otp"
        signup {
          status = "required"
          verification {
            active = true
          }
        }
      }
    }

    authentication_methods {
        passkey {
            enabled = true
        }
        password {
            enabled = true
        }
    }
  }
}

resource "auth0_connection_client" "primary_account_vault_web" {
  connection_id = auth0_connection.primary_account.id
  client_id     = auth0_client.vaultmcp_web.id
}