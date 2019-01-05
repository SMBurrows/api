import fs from 'fs';
import assert from 'assert';
import flatten from 'lodash/flatten';
import { isAbsolute } from 'path';
import Backend from '../Backend';
import requiredParam from '../statics/requiredParam';
import Resource from '../Resource';
import resourceExistsInList from '../statics/resourceExistsInList';
import DeploymentConfig from '../DeploymentConfig';
import Namespace from '../Namespace';
import GraphTraverser, { NodeStack } from './GraphTraverser';

/**
 * Creates an instance of Project.
 *
 * @param {string} project - The name of the project
 * @param {backend} backen - An instance of the Backend class
 * @param {string} dist - An absolute path pointing to the destination folder for built resources
 * @param {*} [fileStystem=fs]
 * @class Project
 */
class Project {
  constructor(project, backend, dist, fileStystem = fs) {
    assert(typeof project === 'string', 'project must be a string');
    assert(backend instanceof Backend, 'backend must be instance of Backend');
    assert(
      typeof dist === 'string' && isAbsolute(dist),
      'Dist must be a string and an absolute path pointing the the dist folder for tfinjs',
    );

    assert(
      fs.writeFileSync && fs.readFileSync && fs.mkdir && fs.stat,
      'fileSystem must be implemented as the node fs module',
    );

    this.project = project;
    this.backend = backend;
    this.dist = dist;
    this.fs = fileStystem;

    if (this.backend.shouldCreateBackend()) {
      /* create dummy deployment and api where the backend can be created */
      const backendBackend = new Backend(null);
      this.backendProject = new Project(
        project,
        backendBackend,
        dist,
        fileStystem,
      );
      const backendNamespace = new Namespace(
        this.backendProject,
        '__tfinjs__backend__',
      );
      const deploymentConfig = new DeploymentConfig(backendNamespace, {
        environment: '_',
        version: '_',
        provider: this.backend.getProvider(),
      });
      this.addResource(this.backend.create(deploymentConfig));
    }
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
      'dist must be a string of an absolute path',
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
   * Gets the dependency tree of the resources of the project
   *
   * @returns {object} dependencyTree
   * @memberof Project
   */
  getDependencyGraph() {
    const levels = [];

    const withoutDependencies = this.resources.filter(
      (resource) => resource.getDependencies().length === 0,
    );
    levels.push(withoutDependencies);

    const addWhatCanBeAddedToLevels = () => {
      const dependencyLevel = this.resources.filter(
        (resource) =>
          !flatten(levels).includes(resource)
          && resource
            .getDependencies()
            .every((depResource) => flatten(levels).includes(depResource)),
      );
      if (dependencyLevel.length > 0) {
        levels.push(dependencyLevel);
        addWhatCanBeAddedToLevels();
      }
    };

    addWhatCanBeAddedToLevels();

    const circular = this.resources.filter(
      (resource) => !flatten(levels).includes(resource),
    );

    const tree = flatten(levels);

    const nodes = new NodeStack();

    circular.forEach((resource) => {
      const name = resource.getUri();
      nodes.addNode(name);

      resource.getDependencies().forEach((dependency) => {
        nodes.addEdge(name, dependency.getUri());
      });
    });

    const graph = new GraphTraverser(nodes);

    const circularDocumentation = graph
      .getCycles()
      .getNodeStacks()
      .map((nodeStack) => nodeStack.getSortedNodes().join('->'));

    return {
      tree: tree.map((resource) => resource.getUri()),
      circular: circular.map((resource) => resource.getUri()),
      circularDocumentation,
    };
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
}

export default Project;
