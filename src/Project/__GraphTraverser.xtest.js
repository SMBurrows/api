/* eslint-env jest */
import GraphTraverser, { NodeStack } from './GraphTraverser';

const parseGraphResult = (graph) =>
  graph
    .getCycles()
    .getNodeStacks()
    .map((nodeStack) => nodeStack.getSortedNodes());

test('GraphTraverser', () => {
  const data = new NodeStack({
    1: ['2'],
    2: ['1'],
    3: ['2', '4'],
    4: ['3', '1'],
  });
  const graph = new GraphTraverser(data);
  const result = parseGraphResult(graph);
  expect(result).toEqual([['1', '2'], ['1', '2', '3', '4']]);
});

test('GraphTraverser sort', () => {
  const data = new NodeStack({
    a: ['b'],
    b: ['a'],
    c: ['b', 'd'],
    d: ['c', 'a'],
  });
  const graph = new GraphTraverser(data);
  const result = parseGraphResult(graph);
  expect(result).toEqual([['a', 'b'], ['a', 'b', 'c', 'd']]);
});

test('Long circular', () => {
  const data = new NodeStack({
    1: ['2'],
    2: ['3'],
    3: ['4'],
    4: ['1'],
    5: [],
    6: ['7'],
    7: ['6'],
    8: ['8'],
  });
  const graph = new GraphTraverser(data);
  const result = parseGraphResult(graph);
  expect(result).toEqual([['1', '2', '3', '4'], ['6', '7'], ['8']]);
});

test('Naive', () => {
  const data = new NodeStack({
    1: ['2'],
    2: ['3'],
    3: ['1'],
    4: [],
    5: ['5'],
  });
  const graph = new GraphTraverser(data);
  const result = parseGraphResult(graph);
  expect(result).toEqual([['1', '2', '3'], ['5']]);
});

xtest('removeNode', () => {
  const data = new NodeStack({
    1: ['2'],
    2: ['3'],
    3: ['1'],
    4: [],
    5: ['5'],
  });
  const graph = new GraphTraverser(data);
  const result = graph.removeNode(3);
  expect(result).toEqual([1, 2, 3]);
});

xtest('get getNonCyclicDependencies', () => {
  const data = new NodeStack({
    1: ['2'],
    2: ['3', '6'],
    3: ['4'],
    4: [],
    5: ['5'],
    6: [],
  });
  const graph = new GraphTraverser(data);
  const result = graph.getNonCyclicDependencies();
  expect(result).toEqual([['4', '6'], ['3'], ['2'], ['1']]);
});

test('getNonCyclicDependencies, remove cyclic', () => {
  const data = new NodeStack({
    1: ['2'],
    2: ['3', '6', '1'],
    3: ['4'],
    4: [],
    5: ['5'],
    6: [],
  });
  const graph = new GraphTraverser(data);
  const result = graph.getNonCyclicDependencies();
  expect(result).toEqual([['4', '6'], ['3']]);
});

test('getNonCyclicDependenciesOfNodes', () => {
  const data = new NodeStack({
    1: ['2'],
    2: ['3', '6', '1'],
    3: ['4'],
    4: [],
    5: ['5'],
    6: [],
  });
  const graph = new GraphTraverser(data);
  const result = graph.getNonCyclicDependenciesOfNode('1');
  console.log(result);
});
