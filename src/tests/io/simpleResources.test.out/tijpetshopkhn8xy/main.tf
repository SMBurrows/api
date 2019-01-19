provider "aws" {
  assume_role = {
    role_arn = "arn:aws:iam::13371337:role/DeploymentRole"
  }

  region = "eu-north-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "tijpetshopkhn8xy.terraform.tfstate"
    region = "us-east-1"
  }
}

data "external" "save_latest_deploy" {
  depends_on = [
    "aws_iam_policy.cloudwatch_attachable_policy",
  ]

  program = [
    "node",
    "-e",
    "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'tijpetshopkhn8xy')",
  ]
}

resource "aws_iam_policy" "cloudwatch_attachable_policy" {
  policy = <<EOF
{"Version":"2012-10-17","Statement":[{"Action":["logs:CreateLogStream"],"Effect":"Allow","Resource":"arn:aws:logs:eu-north-1:13371337:log-group:/aws/lambda/tijpetshop191gflg:*"},{"Action":["logs:PutLogEvents"],"Effect":"Allow","Resource":"arn:aws:logs:eu-north-1:13371337:log-group:/aws/lambda/tijpetshop191gflg:*:*"}]}
EOF

  provisioner "local-exec" {
    command = "require('@tfinjs/api/utils').saveDeploymentStatus('${path.root}', 'DESTROYED')"

    interpreter = [
      "node",
      "-e",
    ]

    when = "destroy"
  }
}

output "tfinjs_arn" {
  value = "${aws_iam_policy.cloudwatch_attachable_policy.arn}"
}
