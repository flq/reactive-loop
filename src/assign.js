import {assign as lodashAssign} from 'lodash';

export default function assign(...all) {
  return lodashAssign({}, ...all);
}