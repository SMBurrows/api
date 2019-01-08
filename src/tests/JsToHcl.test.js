import { resolve } from 'path';
import mkdrip from 'mkdirp';
import { writeFileSync, readFileSync } from 'fs';
import JsToHcl, { Provisioner } from '../JsToHcl';
import hclPrettify from '../statics/hclPrettify';
import snapshot from '../testUtils/snapshot';

/* eslint-env jest */

test('JsToHcl default', async () => {
  mkdrip.sync(__dirname, 'io/JsToHcl/default');

  const infile = resolve(__dirname, 'io/JsToHcl/default/in.json');
  const reffile = resolve(__dirname, 'io/JsToHcl/default/ref.tf');
  const outfile = resolve(__dirname, 'io/JsToHcl/default/out.tf');

  const js = JSON.parse(readFileSync(infile).toString());
  const jsToHcl = new JsToHcl();
  const result = jsToHcl.stringify(js);

  const prettyResult = await hclPrettify(result);
  writeFileSync(outfile, prettyResult);

  snapshot(reffile, outfile, false);
});

/* add provisioner */

test('JsToHcl with provisioner', async () => {
  mkdrip.sync(__dirname, 'io/JsToHcl/withProvisioner');

  const reffile = resolve(__dirname, 'io/JsToHcl/withProvisioner/ref.tf');
  const outfile = resolve(__dirname, 'io/JsToHcl/withProvisioner/out.tf');

  const js = {
    provisioner1: new Provisioner('local-exec', {
      command: 'echo first',
    }),
    provisioner2: new Provisioner('local-exec', {
      command: 'echo second',
    }),
  };
  const jsToHcl = new JsToHcl();
  const result = jsToHcl.stringify(js);

  const prettyResult = await hclPrettify(result);
  writeFileSync(outfile, prettyResult);

  snapshot(reffile, outfile, false);
});
