# # This is an example of a Google OAuth2 connection.

# resource "auth0_connection" "google_oauth2" {
#   name     = "google-oauth2"
#   strategy = "google-oauth2"

#   options {
#     client_id                = var.google_client_id
#     client_secret            = var.google_client_secret
#     set_user_root_attributes = "on_each_login"
#     non_persistent_attrs     = ["ethnicity", "gender"]
    
#     federated_connections_access_tokens {
#         active = true
#     }

#     scopes = ["email", "profile", "https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.readonly"]
#   }
# }