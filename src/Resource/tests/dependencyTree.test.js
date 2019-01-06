/* eslint-env jest */

import Resource from '..';
import { reference } from '../../helpers';
import deploymentConfig, { project } from './deploymentConfig';

test('circular dependencies', async () => {
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
