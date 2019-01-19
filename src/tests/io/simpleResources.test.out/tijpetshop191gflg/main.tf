provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshop191gflg.terraform.tfstate"
    region = "us-east-1"
  }
}

data "external" "save_latest_deploy" {
  depends_on = [
    "aws_dynamodb_table.pets",
  ]

  program = [
    "node",
    "-e",
    "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'tijpetshop191gflg')",
  ]
}

resource "aws_dynamodb_table" "pets" {
  description   = "pet lambda"
  function_name = "tijpetshop191gflg"
  handler       = "service.handler"
  memory_size   = 512

  provisioner "local-exec" {
    command = "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'DESTROYED')"

    interpreter = [
      "node",
      "-e",
    ]

    when = "destroy"
  }

  role      = "${data.terraform_remote_state.tijpetshop1jcp9vz.tfinjs_arn}"
  runtime   = "nodejs8.10"
  s3_bucket = "pet-lambda-bucket"
  s3_key    = "tijpetshop191gflg"
  timeout   = 20
}

data "terraform_remote_state" "tijpetshop1jcp9vz" {
  backend = "s3"

  config = {
    bucket = "terraform-state-prod"
    key    = "tijpetshop1jcp9vz.terraform.tfstate"
    region = "us-east-1"
  }
}
