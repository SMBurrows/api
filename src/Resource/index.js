import { resolve } from 'path';
import mkdirp from 'mkdirp';
import assert from 'assert';
import camelCase from 'lodash/camelCase';
import set from 'lodash/set';
import get from 'lodash/get';
import JsToHcl from '../JsToHcl';
import requiredParam from '../statics/requiredParam';
import md5 from '../statics/md5';
import throwError from '../statics/throwError';
import DeploymentConfig from '../DeploymentConfig';
import createTerraformStringInterpolation from '../statics/createTerraformStringInterpolation';
import resourceExistsInList from '../statics/resourceExistsInList';
import uuid from '../statics/uuid';
import hclPrettify from '../statics/hclPrettify';

const hooks = ['buildHook', 'serializingHook'];

/**
 * Creates an instance of Resource.
 *
 * @param {deploymentConfig} deploymentConfig - DeploymentConfig instance
 * @param {type} type - Resource type, e.g. aws_iam_role
 * @param {name} name - Resource name, some name for the resource
 * @param {body} body - Resource body, the terraform key value pairs
 * @class Resource
 */
class Resource {
  constructor(
    deploymentConfig = requiredParam('deploymentConfig'),
    type = requiredParam('type'),
    name = requiredParam('name'),
    body = requiredParam('body'),
  ) {
    assert(
      deploymentConfig instanceof DeploymentConfig,
      'deploymentConfig must be an instance of DeploymentConfig',
    );
    assert(typeof type === 'string', 'type must be string');
    assert(typeof name === 'string', 'name must be string');
    assert(typeof body === 'object', 'name must be object');

    const makeAddHook = (hookName) => (hook) => {
      const id = uuid();
      this[hookName][id] = hook;
      return id;
    };
    const makeRemoveHook = (hookName) => (id) => {
      delete this[hookName][id];
      return id;
    };

    hooks.forEach((hookName) => {
      const preHookName = camelCase(`pre_${hookName}s`);
      const postHookName = camelCase(`post_${hookName}s`);
      this[preHookName] = [];
      this[postHookName] = [];

      const addPreHookName = camelCase(`add_pre_${hookName}`);
      const addPostHookName = camelCase(`add_post_${hookName}`);
      const removePreHookName = camelCase(`remove_pre_${hookName}`);
      const removePostHookName = camelCase(`remove_post_${hookName}`);

      this[addPreHookName] = makeAddHook(preHookName);
      this[addPostHookName] = makeAddHook(postHookName);
      this[removePreHookName] = makeRemoveHook(preHookName);
      this[removePostHookName] = makeRemoveHook(postHookName);
    });

    this.type = type;
    this.name = name;

    this.deploymentConfig = deploymentConfig;

    this.body = this.parseValue(body);

    this.deploymentConfig.namespace.project.addResource(this);
  }

  /**
   * Gets backend
   *
   * @returns {backend} backend
   * @memberof Resource
   */
  getBackend() {
    return this.getProject().backend;
  }

  /**
   * Gets project
   *
   * @returns {project} project
   * @memberof Resource
   */
  getProject() {
    return this.getNamespace().project;
  }

  /**
   * Gets namespace
   *
   * @returns {namespace} namespace
   * @memberof Resource
   */
  getNamespace() {
    return this.getDeploymentConfig().namespace;
  }

  /**
   * Gets deploymentConfig
   *
   * @returns {deploymentConfig} deploymentConfig
   * @memberof Resource
   */
  getDeploymentConfig() {
    return this.deploymentConfig;
  }

  /**
   * Gets the resource body
   *
   * @param {string|number=} key
   * @returns {body} body - Resource body or the value of the key
   * @memberof Resource
   */
  getBody(key) {
    if (typeof key === 'string' || typeof key === 'number') {
      return get(this.body, key);
    }
    return {
      ...this.body,
    };
  }

  /**
   * Update a key in the hcl body
   *
   * @param {string} key
   * @param {body} val
   * @memberof Resource
   */
  updateBody(key, val) {
    set(this.body, key, this.parseValue(val));
  }

  /**
   * Gets the resource type
   *
   * @returns {type} type - Resource type
   * @memberof Resource
   */
  getType() {
    return this.type;
  }

  /**
   * Gets the resource name
   *
   * @returns {name} name - Resource name
   * @memberof Resource
   */
  getName() {
    return this.name;
  }

  /**
   * Recursivly searches through the params for values of type function and then evaulates that function
   *
   * @param {params} params - params
   * @returns {params} params - params
   * @memberof Resource
   */
  parseValue(params = requiredParam('params')) {
    let result = params;
    if (typeof params === 'function') {
      result = params(this);
    } else if (typeof params === 'object' && !Array.isArray(params)) {
      result = this.mapObject(params);
    } else if (Array.isArray(params)) {
      result = this.mapArray(params);
    }
    if (result === null || typeof result === 'undefined') {
      throwError('Value cannot be null or undefined', this.parseValue);
    }
    return result;
  }

  /**
   * Parses each value in an object
   *
   * @param {params} params - params
   * @returns {params} params - params
   * @memberof Resource
   */
  mapObject(params = requiredParam('params')) {
    return Object.entries(params).reduce((c, [key, value]) => {
      const result = this.parseValue(value);
      return {
        ...c,
        [key]: result,
      };
    }, {});
  }

  /**
   * Parses each value in an array
   *
   * @param {params} params - params
   * @returns {params} params - params
   * @memberof Resource
   */
  mapArray(params = requiredParam('params')) {
    return params.map((value) => this.parseValue(value));
  }

  /**
   * Create the versioned name which is derived from the 7 parametes: project, environment, version, platform, namespace, type and name
   *
   * @returns {versionedName} versionedName - The versioned name
   * @memberof Resource
   */
  versionedName() {
    /* must depend on these 7 parameters */
    const uri = this.getUri();

    const normalizeProjectName = this.deploymentConfig.namespace.project
      .getValue()
      .slice(0, 19)
      .replace(/[^A-Za-z0-9]/g, '')
      .toLowerCase();

    const versionedName = `tij${normalizeProjectName}${md5(uri).slice(0, 8)}`;
    return versionedName;
  }

  /**
   * Returns the resource uri. This consists of the api uri and the resource type and name.
   *
   * @returns {string} uri
   * @memberof Resource
   */
  getUri() {
    const uri = `${this.deploymentConfig.getUri()}/${this.type}/${this.name}`;
    return uri;
  }

  /**
   * List of remote states to add the the HCL file when deriving it for isolated deployment
   *
   * @memberof Resource
   */
  remoteStates = [];

  /**
   * List of outputs to add the the HCL file when deriving it for isolated deployment
   *
   * @memberof Resource
   */
  outputs = [];

  /**
   * Maybe (if it doesn't already exist) adds a resource to a list which will be converted to a remove data state in the HCL during HCL file generation
   *
   * @param {string} resource - resource
   * @memberof Resource
   */
  registerRemoteState(resource = requiredParam('resource')) {
    assert(resource instanceof Resource, 'resource must be a instance of Resource')
    
    if (!resourceExistsInList(this.remoteStates, resource)) {
      this.remoteStates.push(resource);
    }
  }

  addOutputKey(key = requiredParam('key')) {
    if (typeof key !== 'string') {
      throwError('key must be a string');
    }
    if (!this.outputs.includes(key)) {
      this.outputs.push(key);
    }
  }

  callHooks(key) {
    Object.entries(this[key]).forEach(([id, hook]) => hook(this, id));
  }

  async callAsyncHooks(key) {
    await Promise.all(
      Object.entries(this[key]).map(async ([id, hook]) => hook(this, id)),
    );
  }

  /**
   * Generates the HCL content of the resource (with remote states)
   *
   * @returns {hcl} hcl - hcl
   * @memberof Resource
   */
  getHcl() {
    this.callHooks('preSerializingHooks');

    const converter = new JsToHcl();
    const resourceHcl = `resource "${this.type}" "${
      this.name
    }" {${converter.stringify(this.body)}}`;

    const remoteDataSourcesHcl = this.remoteStates
      .map((resource) => {
        const versionedName = resource.versionedName();
        return resource.deploymentConfig.namespace.project.backend.getDataConfig(
          versionedName,
        );
      })
      .join('\n');

    const outputs = this.outputs
      .map(
        (key) =>
          /* tfinjs prefix because of https://github.com/hashicorp/terraform/issues/7982 */
          `output "tfinjs_${key}" {${converter.stringify({
            value: createTerraformStringInterpolation(
              `${this.type}.${this.name}.${key}`,
            ),
          })}}`,
      )
      .join('\n');

    const providerHcl = this.deploymentConfig.provider.getHcl();
    const backendHcl = this.deploymentConfig.namespace.project.backend.getBackendHcl(
      this.versionedName(),
    );

    this.callHooks('postSerializingHooks');

    return [
      providerHcl,
      backendHcl,
      resourceHcl,
      remoteDataSourcesHcl,
      outputs,
    ].join('\n');
  }

  getOutputFolder() {
    const dist = this.deploymentConfig.namespace.project.getDist();
    const name = this.versionedName();
    const outputFolder = resolve(dist, name);
    return outputFolder;
  }

  async build() {
    await this.callAsyncHooks('preBuildHooks');
    const fs = this.deploymentConfig.namespace.project.getFs();
    const outputFolder = this.getOutputFolder();
    mkdirp.sync(outputFolder, {
      fs,
    });
    const hcl = this.getHcl();

    const prettyHcl = await hclPrettify(hcl);

    fs.writeFileSync(resolve(outputFolder, 'main.tf'), prettyHcl);
    await this.callAsyncHooks('postBuildHooks');
  }
}

export default Resource;
