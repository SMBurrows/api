import assert from 'assert';
import Namespace from '../Namespace/NamespaceParent';
import Provider from '../Provider';
import DeploymentConfigParent from './DeploymentConfigParent';

/**
 * Creates an instance of DeploymentConfig.
 *
 * @param {namespace} namespace - An instance of the Namespace class
 * @param {object} config - Configuration object for the deployment config
 * @param {string} config.environment - The deployment environment
 * @param {string} config.version - The deployment version
 * @param {provider} config.provider - And instance of the Provider class which defines to which tennant and location resources with this config should be deployed
 * @class DeploymentConfig
 */
class DeploymentConfig extends DeploymentConfigParent {
  constructor(namespace, { environment, version, provider }) {
    super();
    assert(
      namespace instanceof Namespace,
      'namespace must be an instance of Namespace',
    );
    assert(typeof environment === 'string', 'environment must be string');
    assert(typeof version === 'string', 'version must be string');
    assert(
      provider instanceof Provider,
      'provider must be an instance of Provider',
    );

    this.namespace = namespace;
    this.environment = environment;
    this.version = version;
    this.provider = provider;
  }

  /**
   * Gets the uri of the API.
   * Is unique based on
   * project, environment, version,
   * providerUri and the namespace.
   *
   * @returns {apiUri} apiUri - The Api uri
   * @memberof DeploymentConfig
   */
  getUri() {
    const { environment, version, namespace } = this;
    const project = this.namespace.project.getValue();

    assert(
      namespace instanceof Namespace,
      'namespace must be an instance of Namespace',
    );
    assert(typeof environment === 'string', 'environment must be a string');
    assert(typeof version === 'string', 'version must be a string');
    assert(typeof project === 'string', 'project value must be a string');
    const uri = `${project}/${environment}/${version}/${this.provider.getUri()}/${namespace.getValue()}`;
    return uri;
  }
}

export default DeploymentConfig;
