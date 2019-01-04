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
