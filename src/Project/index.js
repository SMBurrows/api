import fs from 'fs';
import get from 'lodash/get';
import assert from 'assert';
import fromPairs from 'lodash/fromPairs';
import flatten from 'lodash/flatten';
import { isAbsolute } from 'path';
import { join } from 'upath';
import Backend from '../Backend';
import requiredParam from '../statics/requiredParam';
import Resource from '../Resource';
import resourceExistsInList from '../statics/resourceExistsInList';
import DeploymentConfig from '../DeploymentConfig';
import Namespace from '../Namespace';
import GraphTraverser, { NodeStack } from './GraphTraverser';

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

  getFs() {
    return this.fs;
  }

  getDist() {
    return this.dist;
  }

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
          && resource.getDependencies().every((depResource) =>
            flatten(levels).includes(depResource)),
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

  getResourceFromUri(uri) {
    return this.resources.find((resource) => resource.getUri() === uri);
  }
}

export default Project;
