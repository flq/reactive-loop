import {assign as lodashAssign} from 'lodash';

export default function assign<T extends U, U>(target: T, more : U) : Object {
  return lodashAssign({}, target, more);
}