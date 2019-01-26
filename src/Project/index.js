import fs from 'fs';
import assert from 'assert';
import { isAbsolute } from 'path';
import Backend from '../Backend';
import requiredParam from '../statics/requiredParam';
import Resource from '../Resource';
import resourceExistsInList from '../statics/resourceExistsInList';
import DeploymentConfig from '../DeploymentConfig';
import Namespace from '../Namespace';
import ProjectParent from './ProjectParent';

/**
 * Creates an instance of Project.
 *
 * @param {string} project - The name of the project
 * @param {backend} backen - An instance of the Backend class
 * @param {string} dist - An absolute path pointing to the destination folder for built resources
 * @param {*} [fileSystem=fs]
 * @class Project
 */
class Project extends ProjectParent {
  constructor(project, backend, dist, fileSystem = fs) {
    super();
    assert(typeof project === 'string', 'project must be a string');
    assert(backend instanceof Backend, 'backend must be instance of Backend');

    if (backend.shouldCreateBackend()) {
      /* create dummy deployment and api where the backend can be created */
      const backendBackend = new Backend(null);
      this.backendProject = new Project(
        project,
        backendBackend,
        dist,
        fileSystem,
      );
      const backendNamespace = new Namespace(
        this.backendProject,
        '__tfinjs__backend__',
      );
      const deploymentConfig = new DeploymentConfig(backendNamespace, {
        environment: '_',
        version: '_',
        provider: backend.getProvider(),
      });
      const backendResource = backend.create(deploymentConfig);
      this.addResource(backendResource);
    }

    this.project = project;
    this.backend = backend;

    this.setFs(fileSystem);
    this.setDist(dist);
  }

  /**
   * Gets the filesystem of this project
   *
   * @returns {*} fs
   * @memberof Project
   */
  getFs() {
    return this.fs;
  }

  /**
   * Sets the filesystem of this project
   *
   * @returns {*} fs
   * @memberof Project
   */
  setFs(fileSystem) {
    assert(
      fileSystem.writeFileSync
        && fileSystem.readFileSync
        && fileSystem.mkdir
        && fileSystem.stat,
      'fileSystem must be implemented as the node fs module',
    );
    if (this.backend.shouldCreateBackend()) {
      this.backendProject.setFs(fileSystem);
    }
    this.fs = fileSystem;
  }

  /**
   * Gets the dist folder of this project
   *
   * @returns {string} dist
   * @memberof Project
   */
  getDist() {
    return this.dist;
  }

  /**
   * Updates the dist folder of this project
   *
   * @param {string} dist
   * @memberof Project
   */
  setDist(dist) {
    assert(
      typeof dist === 'string' && isAbsolute(dist),
      'dist must be a string and an absolute path pointing the the dist folder for tfinjs',
    );
    if (this.backend.shouldCreateBackend()) {
      this.backendProject.setDist(dist);
    }
    this.dist = dist;
  }

  /**
   * Gets the name value of this project
   *
   * @returns {string} project - The name of the project
   * @memberof Project
   */
  getValue() {
    return this.project;
  }

  /**
   * Array of added resources
   *
   * @memberof Deployment
   */
  resources = [];

  /**
   * Registers a new resource
   *
   * @param {resource} resource - The resource to be added
   * @memberof Deployment
   */
  addResource(resource = requiredParam('resource')) {
    assert(
      resource instanceof Resource,
      'resource must be an instance of Resource',
    );
    if (resourceExistsInList(this.resources, resource)) {
      const error = new Error(
        'You currently have multiple resources with the same properties which is not allowed',
      );
      throw error;
    }

    this.resources.push(resource);
  }

  /**
   * Gets the resources of the deployment
   *
   * @returns {resources[]} resources - array of resources
   * @memberof Deployment
   */
  getResources() {
    return this.resources;
  }

  /**
   * Gets the dependency graph of the resources of the project
   *
   * @returns {object} graph
   * @memberof Project
   */
  getDependencyGraph() {
    return this.getResources().reduce(
      (nodes, resource) => ({
        ...nodes,
        [resource.versionedName()]: resource
          .getDependencies()
          .map((dependencyResource) => dependencyResource.versionedName()),
      }),
      {},
    );
  }

  /**
   * Gets a resource of the project based on its uri
   *
   * @param {string} uri
   * @returns {resource} resource
   * @memberof Project
   */
  getResourceFromUri(uri) {
    return this.resources.find((resource) => resource.getUri() === uri);
  }

  /**
   * Gets a resource of the project based on its versioned name
   *
   * @param {string} uri
   * @returns {resource} resource
   * @memberof Project
   */
  getResourceFromVersionedName(versionedName) {
    return this.resources.find(
      (resource) => resource.versionedName() === versionedName,
    );
  }
}

export default Project;
