/* eslint-env jest */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { mkdirpSync } from 'fs-extra';
import { dirname } from 'path';

const snapshot = (outFile, content, newSnapshot) => {
  mkdirpSync(dirname(outFile));

  if (newSnapshot || !existsSync(outFile)) {
    writeFileSync(outFile, content);
  }

  expect(readFileSync(outFile).toString()).toBe(content);
};
export default snapshot;
