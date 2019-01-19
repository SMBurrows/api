/* eslint-env jest */
/* eslint-disable import/no-extraneous-dependencies */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { mkdirpSync } from 'fs-extra';
import { dirname } from 'path';

const snapshot = (referenceFile, outFile, newSnapshot) => {
  mkdirpSync(dirname(referenceFile));

  if (newSnapshot || !existsSync(referenceFile)) {
    writeFileSync(referenceFile, readFileSync(outFile));
  }

  expect(readFileSync(referenceFile, 'utf8').toString()).toBe(
    readFileSync(referenceFile, 'utf8').toString(),
  );
};
export default snapshot;
