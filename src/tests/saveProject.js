import { resolve } from 'path';
import snapshot from '../testUtils/snapshot';

const saveProject = async (project, referenceFolder, outputFolder) => {
  await Promise.all(
    project.getResources().map(async (resource) => {
      await resource.build();
      snapshot(
        resolve(referenceFolder, resource.versionedName(), 'main.tf'),
        resolve(outputFolder, resource.versionedName(), 'main.tf'),
        false,
      );
    }),
  );
};
export default saveProject;
