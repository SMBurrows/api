/* eslint-env jest */
import { resolve } from 'path';
import awsProviderUri from '../Provider/uris/aws';
import Provider from '../Provider';
import Backend from '../Backend';
import saveProject from './saveProject';
import Project from '../Project';
import Namespace from '../Namespace';
import DeploymentConfig from '../DeploymentConfig';
import Resource from '../Resource';
import { reference, versionedName } from '../helpers';

test('circular dependencies', async () => {
  const dist = resolve(__dirname, 'io/simpleResources.test.out');
  const awsAccoundId = 13371337;
  const awsRegion = 'eu-north-1';
  const backendBucketName = 'terraform-state-prod';
  const backendBucketRegion = 'us-east-1';

  const backend = new Backend('s3', {
    backendConfig: (name) => ({
      bucket: backendBucketName,
      key: `${name}.terraform.tfstate`,
      region: backendBucketRegion,
    }),
    dataConfig: (name) => ({
      bucket: backendBucketName,
      key: `${name}.terraform.tfstate`,
      region: backendBucketRegion,
    }),
    provider: new Provider(
      'aws',
      {
        region: backendBucketRegion,
        assume_role: {
          role_arn: `arn:aws:iam::${awsAccoundId}:role/DeploymentRole`,
        },
      },
      awsProviderUri(awsAccoundId, backendBucketRegion),
    ),
    create: (deploymentConfig) =>
      new Resource(deploymentConfig, 'aws_s3_bucket', 'terraform_state_prod', {
        bucket: backendBucketName,
        acl: 'private',
        versioning: {
          enabled: true,
        },
      }),
  });

  const project = new Project('pet-shop', backend, dist);

  const provider = new Provider(
    'aws',
    {
      region: awsRegion,
      assume_role: {
        role_arn: `arn:aws:iam::${awsAccoundId}:role/DeploymentRole`,
      },
    },
    awsProviderUri(awsAccoundId, awsRegion),
  );

  const namespace = new Namespace(project, 'services/lambdas/add-pet');

  const deploymentConfig = new DeploymentConfig(namespace, {
    environment: 'stage',
    version: 'v1',
    provider,
  });

  const one = new Resource(deploymentConfig, 'aws_dynamodb_table', '1', {
    resourceId: 1,
  });
  const two = new Resource(deploymentConfig, 'aws_dynamodb_table', '2', {
    resourceId: 2,
    ref: reference(one, 'someattr'),
  });
  const three = new Resource(deploymentConfig, 'aws_dynamodb_table', '3', {
    resourceId: 3,
    ref: reference(two, 'someattr'),
  });
  const four = new Resource(deploymentConfig, 'aws_dynamodb_table', '4', {
    resourceId: 4,
    ref: reference(three, 'someattr'),
    reff: reference(one, 'someattr'),
  });
  one.updateBody('ref', reference(two, 'someattr'));
  three.updateBody('ref', reference(four, 'someattr'));

  expect(project.getDependencyGraph()).toEqual({
    tree: [
      'pet-shop/_/_/aws/13371337/us-east-1/__tfinjs__backend__/aws_s3_bucket/terraform_state_prod',
    ],
    circular: [
      'pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/1',
      'pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/2',
      'pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/3',
      'pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/4',
    ],
    circularDocumentation: [
      'pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/1->pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/2',
      'pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/1->pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/2->pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/3->pet-shop/stage/v1/aws/13371337/eu-north-1/services/lambdas/add-pet/aws_dynamodb_table/4',
    ],
  });
});
