import murmur from './murmur';

/* eslint-env jest */

test('murmur', () => {
  const text = 'Mollit aliquip velit laborum occaecat consectetur culpa ad minim in amet ad duis. Eu proident consequat occaecat quis quis aliquip. In dolore anim anim ad laborum occaecat. Dolore in culpa excepteur qui do in sit ex nisi minim laborum aute dolor qui. Consectetur ea cillum laboris exercitation. Qui exercitation id ad eiusmod consectetur excepteur labore in.';
  const result = murmur(text);
  expect(result).toBe('1szt0zz');
});
