provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "us-east-1"
}

data "external" "save_latest_deploy" {
  depends_on = [
    "aws_s3_bucket.terraform_state_prod",
  ]

  program = [
    "-c",
    "bash",
    "require('@tfinjs/helpers').saveDeploymentStatus('${path.root}', 'tijpetshopvj8fsk')",
  ]
}

resource "aws_s3_bucket" "terraform_state_prod" {
  acl    = "private"
  bucket = "terraform-state-prod"

  provisioner "local-exec" {
    command = "require('@tfinjs/helpers').saveDeploymentStatus('${path.root}', 'DESTROYED')"

    interpreter = [
      "-e",
      "node",
    ]

    when = "destroy"
  }

  versioning = {
    enabled = true
  }
}
