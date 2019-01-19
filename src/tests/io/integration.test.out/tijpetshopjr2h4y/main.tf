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
    "node",
    "-e",
    "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'tijpetshopjr2h4y')",
  ]
}

resource "aws_s3_bucket" "terraform_state_prod" {
  acl    = "private"
  bucket = "some-backend-bucket"

  provisioner "local-exec" {
    command = "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'DESTROYED')"

    interpreter = [
      "node",
      "-e",
    ]

    when = "destroy"
  }

  versioning = {
    enabled = true
  }
}
