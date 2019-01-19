import has from 'lodash/has';
import get from 'lodash/get';
import flatten from 'lodash/flatten';
import assert from 'assert';

export class NodeStackCollection {
  constructor(nodeStacks = []) {
    assert(Array.isArray(nodeStacks), 'nodeStacks must be an array');
    this.nodeStacks = nodeStacks;
  }

  objectSerialize() {
    return this.nodeStacks.map((nodeStack) => nodeStack.getAdjacencyList());
  }

  getNodeStacks() {
    return this.nodeStacks;
  }

  addNodeStack(nodeStack) {
    this.nodeStacks.push(nodeStack);
  }

  getNodes() {
    return flatten(this.nodeStacks.map((nodeStack) => nodeStack.getNodes()));
  }

  hasNode(node) {
    return this.nodeStacks.some((nodeStack) => nodeStack.hasNode(node));
  }

  getStackOfNode(node) {
    return this.nodeStacks.find((nodeStack) => nodeStack.hasNode(node));
  }
}

export class NodeStack {
  constructor(nodes = {}) {
    assert(typeof nodes === 'object', 'nodes must be an object');
    this.nodes = nodes;
  }

  cyclicNodes = [];

  addEdge(node1, node2) {
    this.nodes[node1].push(node2);
  }

  addNode(node, children = []) {
    if (this.hasNode(node)) {
      throw new Error("Can't add an already existing node");
    }
    this.nodes[node] = children;
  }

  getNodes() {
    return Object.keys(this.nodes);
  }

  getSortedNodes() {
    const sortedNodes = Object.keys(this.nodes).sort();
    if (sortedNodes.length === 0) {
      return [];
    }
    const firstNode = sortedNodes[0];
    const nodes = [firstNode];
    for (let i = 1; i < sortedNodes.length; i += 1) {
      const next = this.nodes[nodes[nodes.length - 1]].sort();
      if (next.length) {
        for (let y = 0; y < next.length; y += 1) {
          if (next[y] && !nodes.includes(next[y])) {
            nodes.push(next[y]);
          }
        }
        i += next.length;
      } else {
        const available = sortedNodes.filter(
          (sortedNode) => !nodes.includes(sortedNode),
        );
        if (available.length) {
          nodes.push(available[0]);
        }
      }
    }
    return nodes;
  }

  getChildren(node) {
    return this.nodes[node];
  }

  getAdjacencyList() {
    return this.nodes;
  }

  hasNode(node) {
    return has(this.nodes, node);
  }

  markCyclicNode(node) {
    if (!this.cyclicNodes.includes(node)) {
      this.cyclicNodes.push(node);
    }
  }

  getCyclicNodes() {
    return this.cyclicNodes;
  }
}

class GraphTraverser {
  constructor(nodeStack = new NodeStack()) {
    assert(
      nodeStack instanceof NodeStack,
      'nodeStack must be an instanceof NodeStack',
    );
    this.nodeStack = nodeStack;
  }

  visitedStack = new NodeStack();

  cycleStacks = new NodeStackCollection();

  getNonCyclicDependenciesOfNode(node) {
    const adjacencyList = this.nodeStack.getAdjacencyList();
    const dependencyLevels = [[node]];

    const addToLevel = () => {
      const dependencies = dependencyLevels[dependencyLevels.length - 1]
        .reduce(
          (nestedDeps, dependencyNode) => [
            ...nestedDeps,
            ...adjacencyList[dependencyNode].filter(
              (a) => !nestedDeps.includes(a),
            ),
          ],
          [],
        )
        .filter(
          (dependencyNode) =>
            !flatten(dependencyLevels).includes(dependencyNode),
        );

      if (dependencies.length) {
        dependencyLevels.push(dependencies);
        addToLevel();
      }
    };
    addToLevel();
    console.log(dependencyLevels);
  }

  getCyclicNodeStacks() {
    const cycles = this.getCycles();
    return cycles.getNodeStacks();
  }

  getCyclicNodes() {
    const cyclicNodeStacks = this.getCyclicNodeStacks();

    const cyclicNodes = flatten(
      cyclicNodeStacks.map((nodeStack) => nodeStack.getCyclicNodes()),
    );
    return cyclicNodes;
  }

  getNonCyclicAdjacencyList() {
    const cyclicNodes = this.getCyclicNodes();
    const nonCyclicAdjacencyList = Object.entries(
      this.nodeStack.getAdjacencyList(),
    ).filter(
      ([node, dependencies]) =>
        !cyclicNodes.includes(node)
        && dependencies.every(
          (dependencyNode) => !cyclicNodes.includes(dependencyNode),
        ),
    );
    return nonCyclicAdjacencyList;
  }

  getNonCyclicDependencies() {
    const nonCyclicGraph = [];

    const nonCyclicAdjacencyList = this.getNonCyclicAdjacencyList();

    const withoutDependencies = nonCyclicAdjacencyList
      .filter(([, dependencies]) => dependencies.length === 0)
      .map(([node]) => node);

    if (withoutDependencies.length > 0) {
      nonCyclicGraph.push(withoutDependencies);
    }

    this.addWhatCanBeAddedToLevels({ nonCyclicAdjacencyList, nonCyclicGraph });

    return nonCyclicGraph;
  }

  addWhatCanBeAddedToLevels({ nonCyclicAdjacencyList, nonCyclicGraph }) {
    const dependencyLevel = nonCyclicAdjacencyList
      .filter(
        ([node, dependencies]) =>
          !flatten(nonCyclicGraph).includes(node)
          && dependencies.every((dependency) =>
            flatten(nonCyclicGraph).includes(dependency)),
      )
      .map(([node]) => node);
    if (dependencyLevel.length > 0) {
      nonCyclicGraph.push(dependencyLevel);
      this.addWhatCanBeAddedToLevels({
        nonCyclicAdjacencyList,
        nonCyclicGraph,
      });
    }
  }

  hasTraversed = false;

  getCycles() {
    if (this.hasTraversed) {
      return this.cycleStacks;
    }
    this.nodeStack.getNodes().forEach((node) => {
      this.detectCycle(node);
    });
    this.hasTraversed = true;
    return this.cycleStacks;
  }

  detectCycle(node, recursionStack = new NodeStack()) {
    if (this.cycleStacks.hasNode(node)) {
      return this.cycleStacks.getStackOfNode(node);
    }

    if (!this.visitedStack.hasNode(node)) {
      const nodes = this.nodeStack.getChildren(node);
      for (let i = 0; i < nodes.length; i += 1) {
        const childNode = nodes[i];
        this.populateRecursionStack(childNode, recursionStack);
      }
    }

    if (recursionStack.hasNode(node)) {
      recursionStack.markCyclicNode(node);
      this.cycleStacks.addNodeStack(recursionStack);
      return recursionStack;
    }

    recursionStack.addNode(node);

    return recursionStack;
  }

  populateRecursionStack(node, recursionStack) {
    if (recursionStack.hasNode(node)) {
      return;
    }
    recursionStack.addNode(node);
    if (!this.visitedStack.hasNode(node)) {
      const nodes = this.nodeStack.getChildren(node);
      for (let i = 0; i < nodes.length; i += 1) {
        const childNode = nodes[i];
        this.populateRecursionStack(childNode, recursionStack);
      }
    }
  }
}

export default GraphTraverser;
