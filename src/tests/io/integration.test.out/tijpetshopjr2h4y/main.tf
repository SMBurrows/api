provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

data "external" "save_latest_deploy" {
  depends_on = [
    "aws_s3_bucket.terraform_state_prod",
  ]

  program = [
    "-c",
    "bash",
    "require('@tfinjs/helpers').saveDeploymentStatus('${path.root}', 'tijpetshopjr2h4y')",
  ]
}

resource "aws_s3_bucket" "terraform_state_prod" {
  acl    = "private"
  bucket = "some-backend-bucket"

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
