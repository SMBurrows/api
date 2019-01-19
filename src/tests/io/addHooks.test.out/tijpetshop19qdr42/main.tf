provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "some-backend-bucket"
    key    = "tijpetshop19qdr42.terraform.tfstate"
    region = "eu-north-1"
  }
}

data "external" "save_latest_deploy" {
  depends_on = [
    "aws_dynamodb_table.customers",
  ]

  program = [
    "node",
    "-e",
    "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'tijpetshop19qdr42')",
  ]
}

resource "aws_dynamodb_table" "customers" {
  hash_key = "CustomerId"
  name     = "tijpetshop19qdr42"

  provisioner "local-exec" {
    command = "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'DESTROYED')"

    interpreter = [
      "node",
      "-e",
    ]

    when = "destroy"
  }

  read_capacity  = 40
  write_capacity = 20
}
