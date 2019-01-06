provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshop1jcp9vz.terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_iam_role" "pets" {
  assume_role_policy = <<EOF
{"Version":"2012-10-17","Statement":[{"Action":"sts:AssumeRole","Principal":{"Service":"lambda.amazonaws.com"},"Effect":"Allow","Sid":""}]}
EOF
}

output "tfinjs_arn" {
  value = "${aws_iam_role.pets.arn}"
}

output "tfinjs_name" {
  value = "${aws_iam_role.pets.name}"
}
