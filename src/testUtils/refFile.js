/* eslint-env jest */
import { join, parse } from 'path';

const refFile = (filename) => {
  const { dir, name } = parse(filename);
  return `${join(dir, name)}.ref`;
};

export default refFile;
