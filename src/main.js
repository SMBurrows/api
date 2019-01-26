import Provider from './Provider';
import Backend from './Backend';
import Project from './Project';
import Namespace from './Namespace';
import DeploymentConfig from './DeploymentConfig';
import Resource from './Resource';
import { reference, versionedName } from './helpers';
import * as utils from './utils';
import * as providerUris from './providerUris';

export default {
  Provider,
  Backend,
  Project,
  Namespace,
  DeploymentConfig,
  Resource,
  reference,
  versionedName,
  utils,
  providerUris,
};
