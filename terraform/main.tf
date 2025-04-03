resource "auth0_prompt" "my_prompt" {
  universal_login_experience     = "new"
  identifier_first               = true
  webauthn_platform_first_factor = false
}