import assert from 'assert';
import Project from '../Project/ProjectParent';
import NamespaceParent from './NamespaceParent';

/**
 * Creates an instance of Namespace.
 *
 * @param {project} project - An instance of the Project class
 * @param {string} namespace - The namespace string
 * @class Namespace
 */
class Namespace extends NamespaceParent {
  constructor(project, namespace) {
    super();
    assert(project instanceof Project);
    assert(typeof namespace === 'string', 'namespace must be a string');

    this.namespace = namespace;
    this.project = project;
  }

  /**
   * Gets the value of the namespace
   *
   * @returns {string} namepsace
   * @memberof Namespace
   */
  getValue() {
    return this.namespace;
  }
}

export default Namespace;
