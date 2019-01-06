provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::133713371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshop1r2h0yy.terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_dynamodb_table" "pets" {
  description   = "pet lambda"
  function_name = "tijpetshop1r2h0yy"
  handler       = "service.handler"
  memory_size   = 512
  role          = "${data.terraform_remote_state.tijpetshopzdimna.tfinjs_arn}"
  runtime       = "nodejs8.10"
  s3_bucket     = "pet-lambda-bucket"
  s3_key        = "tijpetshop1r2h0yy"
  timeout       = 20
}

data "terraform_remote_state" "tijpetshopzdimna" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshopzdimna.terraform.tfstate"
    region = "us-east-1"
  }
}
