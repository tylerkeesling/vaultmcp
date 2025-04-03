variable "auth0_domain" {}
variable "auth0_client_id" {}
variable "auth0_client_secret" {
    sensitive = true
}
variable "issuer_url" {}
variable "action_secret" {
    sensitive = true
}

variable "project_name" {
  default = "Vaultmcp"
}

variable "app_base_url" {
  default = "http://localhost:3000"
}

variable "app_callback_url" {
    default = "http://localhost:3000/auth/callback"
}


# Variables per connection 

variable "google_client_id" {    
}

variable "google_client_secret" {
    sensitive = true
}