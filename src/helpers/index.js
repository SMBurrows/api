import assert from 'assert';
import Resource from '../Resource';
import createTerraformStringInterpolation from '../statics/createTerraformStringInterpolation';
import { TERRAFORM_OUTPUT_PREFIX } from '../constants';

export const versionedName = () => (resource) => {
  assert(
    resource instanceof Resource,
    'resource must be an instance of Resource',
  );
  return resource.versionedName();
};

export const reference = (resource, key) => {
  assert(
    resource instanceof Resource,
    'resource must be an instance of Resource',
  );
  assert(typeof key === 'string', 'key must be string');

  return (sourceResource) => {
    assert(
      sourceResource instanceof Resource,
      'sourceResource must be an instance of Resource',
    );
    assert(
      sourceResource !== resource,
      'you cannot reference the resource itself',
    );
    sourceResource.registerRemoteState(resource);
    resource.addOutputKey(key);

    /* prefix because of https://github.com/hashicorp/terraform/issues/7982 */
    return createTerraformStringInterpolation(
      `data.terraform_remote_state.${resource.versionedName()}.${TERRAFORM_OUTPUT_PREFIX}${key}`,
    );
  };
};
