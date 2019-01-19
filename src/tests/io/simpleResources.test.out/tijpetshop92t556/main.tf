provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshop92t556.terraform.tfstate"
    region = "us-east-1"
  }
}

data "external" "save_latest_deploy" {
  depends_on = [
    "aws_iam_role_policy_attachment.cloud_watch_role_attachment",
  ]

  program = [
    "node",
    "-e",
    "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'tijpetshop92t556')",
  ]
}

resource "aws_iam_role_policy_attachment" "cloud_watch_role_attachment" {
  policy_arn = "${data.terraform_remote_state.tijpetshopkhn8xy.tfinjs_arn}"

  provisioner "local-exec" {
    command = "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'DESTROYED')"

    interpreter = [
      "node",
      "-e",
    ]

    when = "destroy"
  }

  role = "${data.terraform_remote_state.tijpetshop1jcp9vz.tfinjs_name}"
}

data "terraform_remote_state" "tijpetshop1jcp9vz" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshop1jcp9vz.terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "tijpetshopkhn8xy" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshopkhn8xy.terraform.tfstate"
    region = "us-east-1"
  }
}
