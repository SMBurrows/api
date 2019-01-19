/* eslint-env jest */

import Resource from '..';
import deploymentConfig from './deploymentConfig';

test('circular dependencies', async () => {
  const one = new Resource(deploymentConfig, 'aws_dynamodb_table', '1', {
    resourceId: 1,
  });
  const two = new Resource(deploymentConfig, 'aws_dynamodb_table', '2', {
    resourceId: 2,
  });

  expect(one.getContentHash()).toBe('1hh5phc');
  expect(two.getContentHash()).toBe('1h5q195');

  two.addContentHashSeed('newSeed', () => 123);
  expect(two.getContentHash()).toBe('3mrkcw');
  two.removeContentHashSeed('newSeed');
  expect(two.getContentHash()).toBe('1h5q195');
});
