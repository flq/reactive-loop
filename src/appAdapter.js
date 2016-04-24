import {
  each,
  forOwn,
  isString,
  assign, 
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
    const funcWrappers = createFuncWrappers(appFuncsObj.mount, stateRefinements);
    forOwn(appFuncsObj, (val, key) => {
      var selector = getSelector(key, appFuncsObj);
      if (selector) {
        if (key.endsWith("Async"))
          asyncAppFuncs.push({ selector, async: val });
        else
          appFuncs.push({ selector, func: funcWrappers.appFunc(val) });
      }
      if (key.startsWith('refine') || key.startsWith('monitor'))
        stateRefinements.push(val);
      if (key.startsWith('dispatch'))
        actionObservables.push(val());
    });
  });
  return {appFuncs, asyncAppFuncs, stateRefinements, actionObservables};
}

function getSelector(methodName, appObject) {
  if (!isString(methodName))
    return undefined;
  if (!methodName.startsWith("on"))
    return undefined;
  var actionName = methodName.substring(2);
  if (actionName.endsWith("Async"))
    actionName = actionName.substring(0, actionName.length - 5);
  if (appObject[`filterFor${actionName}`])
    return appObject[`filterFor${actionName}`];
  return actionName.charAt(0).toLowerCase() + actionName.substring(1);
}

function createFuncWrappers(mountFunc, stateRefinements) {
  if (mountFunc == undefined)
  {
    return {
      appFunc: (f) => f,
      asyncAppFunc: (f) => f,
      stateRefine: (f) => f
    };
  }
  const mountPoint = mountFunc();
  
  // Adding a state monitor to ensure that the mount point exists
  stateRefinements.push(s => {
    if (s[mountPoint])
     return;
    s[mountPoint] = {};
    return s;
  })
  
  return {
    appFunc(f) {
      return (s,a,d) => {
        const newSFunc = () => s()[mountPoint];
        const subState = {};
        subState[mountPoint] = f(newSFunc,a,d);
        return assign({}, s(), subState);
      };
    }
  }
}