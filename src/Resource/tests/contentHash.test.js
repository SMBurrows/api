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
  });

  expect(one.getContentHash()).toBe('k0ulsj');
  expect(two.getContentHash()).toBe('1fh7rky');

  two.addContentHashSeed('newSeed', () => 123);
  expect(two.getContentHash()).toBe('g7q14s');
  two.removeContentHashSeed('newSeed');
  expect(two.getContentHash()).toBe('1fh7rky');
});
