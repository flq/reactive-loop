import {
  each,
  forOwn,
  isString, 
  isFunction} from 'lodash';

export function adaptApps(apps, context) {
  const appFuncs = [];
  const asyncAppFuncs = [];
  const stateRefinements = [];
  const actionObservables = [];
  each(apps, a => {
    if (!isFunction(a))
      throw Error("You need to provide a function returning your application object when using 'addApp'.");
    var appFuncsObj = a(context);
    forOwn(appFuncsObj, (val, key) => {
      var selector = getActionTypeFromFunctionName(key);
      if (selector) {
        if (key.endsWith("Async"))
          asyncAppFuncs.push({ selector, async: val });
        else
          appFuncs.push({ selector, func: val });
      }
      if (key.startsWith('refine') || key.startsWith('monitor'))
        stateRefinements.push(val);
      if (key.startsWith('dispatch'))
        actionObservables.push(val());
    });
  });
  return {appFuncs, asyncAppFuncs, stateRefinements, actionObservables};
}

function getActionTypeFromFunctionName(methodName) {
  if (!isString(methodName))
    return undefined;
  if (!methodName.startsWith("on"))
    return methodName;
  var actionName = methodName.substring(2);
  if (actionName.endsWith("Async"))
    actionName = actionName.substring(0, actionName.length - 5);
  return actionName.charAt(0).toLowerCase() + actionName.substring(1);
}