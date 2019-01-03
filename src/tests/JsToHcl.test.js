import { resolve } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import JsToHcl from '../JsToHcl';
import hclPrettify from '../statics/hclPrettify';
import snapshot from '../testUtils/snapshot';

/* eslint-env jest */

test('JsToHcl', async () => {
  const infile = resolve(__dirname, 'io/JsToHcl.test.in');
  const reffile = resolve(__dirname, 'io/JsToHcl.test.ref');
  const outfile = resolve(__dirname, 'io/JsToHcl.test.out');

  const js = JSON.parse(readFileSync(infile).toString());
  const jsToHcl = new JsToHcl();
  const result = jsToHcl.stringify(js);

  const prettyResult = await hclPrettify(result);
  writeFileSync(outfile, prettyResult);

  snapshot(reffile, outfile, false);
});
