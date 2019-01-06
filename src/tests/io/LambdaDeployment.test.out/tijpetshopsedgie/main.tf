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

resource "aws_iam_role_policy_attachment" "cloud_watch_role_attachment" {
  policy_arn = "${data.terraform_remote_state.tijpetshopf24hqc.tfinjs_arn}"
  role       = "${data.terraform_remote_state.tijpetshopzdimna.tfinjs_name}"
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
