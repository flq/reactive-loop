import {assign as lodashAssign} from 'lodash';

export default function assign(...all) : Object {
  return lodashAssign({}, ...all);
}