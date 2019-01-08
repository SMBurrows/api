import { writeFileSync } from 'fs';
import assert from 'assert';
import { resolve, isAbsolute } from 'path';

const saveDeploymentStatus = (dir, status) => {
  assert(typeof dir === 'string', 'dir must be a string');
  assert(typeof status === 'string', 'status must be a string');
  assert(isAbsolute(dir), 'dir must be an absolute path');

  const filePath = resolve(dir, 'deployment_status.txt');
  writeFileSync(filePath, status);
  process.stdout.write(
    `${JSON.stringify(
      {
        status,
      },
      null,
      2,
    )}\n`,
  );
};

export default saveDeploymentStatus;
