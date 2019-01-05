import assert from 'assert';
import Resource from '../Resource';
import createTerraformStringInterpolation from '../statics/createTerraformStringInterpolation';
import { TERRAFORM_OUTPUT_PREFIX } from '../constants';

/**
 * Factory function to a function where the returned function takes a resource and returns the versionedName of the resource.
 *
 * @returns {function} versionedName
 */
export const versionedName = () => (resource) => {
  assert(
    resource instanceof Resource,
    'resource must be an instance of Resource',
  );
  return resource.versionedName();
};

/**
 * Factory function to a function which takes a resource and returns the terraform interpolation value which references the key
 *
 * @param {resource} resource - a resource
 * @param {string} key - the key referenced on the resource
 * @returns {function} reference - gets the reference string of the resource
 */
export const reference = (resource, key) => {
  assert(
    resource instanceof Resource,
    'resource must be an instance of Resource',
  );
  assert(typeof key === 'string', 'key must be string');

  return (referencedResource) => {
    assert(
      referencedResource instanceof Resource,
      'referencedResource must be an instance of Resource',
    );
    assert(
      referencedResource !== resource,
      'you cannot reference the resource itself',
    );
    referencedResource.registerRemoteState(resource);
    resource.addOutputKey(key);

    /* prefix because of https://github.com/hashicorp/terraform/issues/7982 */
    return createTerraformStringInterpolation(
      `data.terraform_remote_state.${resource.versionedName()}.${TERRAFORM_OUTPUT_PREFIX}${key}`,
    );
  };
};
