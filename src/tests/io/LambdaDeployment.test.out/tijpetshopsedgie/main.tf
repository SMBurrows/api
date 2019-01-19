provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::133713371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshopsedgie.terraform.tfstate"
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
    "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'tijpetshopsedgie')",
  ]
}

resource "aws_iam_role_policy_attachment" "cloud_watch_role_attachment" {
  policy_arn = "${data.terraform_remote_state.tijpetshopf24hqc.tfinjs_arn}"

  provisioner "local-exec" {
    command = "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'DESTROYED')"

    interpreter = [
      "node",
      "-e",
    ]

    when = "destroy"
  }

  role = "${data.terraform_remote_state.tijpetshopzdimna.tfinjs_name}"
}

data "terraform_remote_state" "tijpetshopzdimna" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshopzdimna.terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "tijpetshopf24hqc" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshopf24hqc.terraform.tfstate"
    region = "us-east-1"
  }
}
