import assert from 'assert';
import requiredParam from './statics/requiredParam';

const isPrimitive = (val) =>
  ['string', 'boolean', 'number'].includes(typeof val);

const parsePrimitive = (val) => {
  switch (typeof val) {
    case 'string':
      return val.match(/"/) ? `<<EOF\n${val}\nEOF` : `"${val}"`;
    case 'number':
      return val;
    case 'boolean':
      return val ? 'true' : 'false';
    default:
      break;
  }
  return val;
};

class JsToHclUtils {
  /**
   * Converts a javascript object or array to HCL
   *
   * @param {object|array} js
   * @returns hcl
   * @memberof JsToHcl
   */
  stringify(js) {
    const hcl = this.parse(js);
    return hcl.replace(/^\{/, '').replace(/\}$/, '');
  }

  /**
   * converts any javascript type to hcl
   *
   * @returns hcl
   * @memberof JsToHcl
   */
  parse = (value = requiredParam('value')) => {
    assert(
      !['undefined', 'symbol'].includes(typeof value)
        && value !== null
        && !Number.isNaN(value),
      'Value cannot be null, undefined, NaN, symbol',
    );
    if (isPrimitive(value)) {
      return parsePrimitive(value);
    }
    if (Array.isArray(value)) {
      return `[
        ${value
        .map(this.parse)
        .join(',\n')}
      ]`;
    }

    if (value instanceof JsToHclUtils) {
      return value.stringify();
    }

    assert(
      typeof value !== 'function',
      'The only function you can provide is an instance of a Provisioner',
    );

    return `{
      ${Object.entries(value)
      .map(this.createHclKeyVal)
      .sort()
      .join('\n')}
    }`;
  };

  /**
   * Creates key value pair in hcl
   *
   * @param {array} params
   * @param {string} params.0 - key
   * @param {string} params.1 - value
   * @returns hcl
   */
  createHclKeyVal = ([
    key = requiredParam('key'),
    value = requiredParam('value'),
  ]) => {
    const parsedValue = this.parse(value);
    if (value instanceof JsToHclUtils) {
      return parsedValue;
    }
    return `${key} = ${parsedValue}`;
  };
}

export class Provisioner extends JsToHclUtils {
  constructor(type, body) {
    super();
    assert(typeof type === 'string', 'type must be a string');
    assert(typeof body === 'object', 'body must be an object');
    this.type = type;
    this.body = body;
  }

  stringify() {
    return `provisioner "${this.type}" ${this.parse(this.body)} `
      .replace(/^\{/, '')
      .replace(/\}$/, '');
  }
}

/**
 * Converts JavaScript to HCL
 *
 * @class JsToHcl
 */
class JsToHcl extends JsToHclUtils {}

export default JsToHcl;
