import {Observable,Subject} from 'rx';
import {
  assign as lodashAssign,
  concat, 
  each,
  forOwn,
  isString, 
  isFunction, 
  map, 
  reduce} from 'lodash';


export function appBuilder() {
  const apps = [];
  const appFuncs = [];
  const asyncAppFuncs = [];
  const stateSugar = [];
  const actionObservables = [];
  let initialState = {};

  const builder = {
    addApp(appProviderFunc) {
      apps.push(appProviderFunc);
      return builder;
    },
    addAppFunc(selector, func) {
      appFuncs.push({ selector, func });
      return builder;
    },
    addErrorListener(func) {
      appFuncs.push({ selector: 'error', func: (s,a) => { func(s,a); return s(); } });
      return this;
    },
    addAsyncAppFunc(selector, async) {
      asyncAppFuncs.push({ selector, async });
      return builder;
    },
    addActionSource(actionObservable) {
      actionObservables.push(actionObservable);
      return builder;
    },
    addStateRefinement(func) {
      stateSugar.push(func);
      return builder;
    },
    setInitialState(state) {
      initialState = state;
      return builder;
    },
    build() {
      return {apps, appFuncs, asyncAppFuncs, actionObservables, stateSugar, initialState};
    }
  };
  return builder;
}

export function appInit(app) {
  
  const { dispatchAction, actionObservable } = actionSource();
  const stateSubject = new Subject();

  let currentState = app.initialState;

  const additionalContext = {
    dispatch: dispatchAction,
    getState: ()=> currentState
  };

  var {appFuncs, stateRefinements} = resolveAppFuncs(app.apps, additionalContext);
  each(appFuncs, appFunc => app.appFuncs.push(appFunc));
  each(stateRefinements, refinement => app.stateSugar.push(refinement));

  const stateObservable = reduce(
     app.stateSugar,
     (agg, func) => agg.map(wrapStateSugarFunc(func)),
     stateSubject).share();

  stateObservable
    .subscribe(s => currentState = s);
  
  var allSyncStates = map(app.appFuncs, (appFunc) => {
    return actionObservable
      .filter(createAppFuncFilter(appFunc.selector))
      .withLatestFrom(stateObservable, (action, state) => { return { state, action } })
      .map(wrapFuncWithErrorDispatch(appFunc.func, additionalContext));
  });
  
  var allAsyncStates = map(app.asyncAppFuncs, (appFunc) => {
    return actionObservable
      .filter(createAppFuncFilter(appFunc.selector))
      .withLatestFrom(stateObservable, (action, state) => { return { state, action } })
      .map(({state,action}) => appFunc
        .async(additionalContext.getState, action, dispatchAction)
        .catch(e => {
          dispatchAction({ type: 'error', whileHandling: action, error: e });
          return state;
        }))
      .mergeAll();
  }); 

  const stateStream = Observable.merge(allSyncStates.concat(allAsyncStates));

  stateStream
    .where(state => state != undefined)
    .subscribe((state)=>stateSubject.onNext(state));
 
  // we put the initial state on the observable which is
  // picked up by the zip calls. However, this means that people
  // who subscribe to the state observable will not get to see the initial state.
  stateSubject.onNext(app.initialState);
 
  each(app.actionObservables, o => o.subscribe(msg => dispatchAction(msg)));

  return {
    getCurrentState() { return currentState; },
    stateObservable,
    actionObservable,
    dispatchAction
  };
}

export function assign(...all) {
  return lodashAssign({}, ...all);
}

function wrapFuncWithErrorDispatch(appFunc, ctx) {
  return ({ state, action}) => {
    try {
      return appFunc(ctx.getState, action, ctx.dispatch);
    }
    catch (e) {
      ctx.dispatch({ type: 'error', whileHandling: action, error: e });
      return state;
    }
  };
}

function wrapStateSugarFunc(func) {
  return s => {
    var result = func(s);
    return result !== undefined ? result : s;
  }
}

function actionSource() { 
  var actionObservable = new Subject();
  return { 
    dispatchAction(action) {
      if (!action.subscribe) {
        //Possibly weak assumption of this NOT being an observable
        action = Observable.just(action);
      }
      action.subscribe(a => {
        actionObservable.onNext(a); 
      }); 
    }, 
    actionObservable 
  };
}

function createAppFuncFilter(selector) {
  if (isString(selector))
    return (f => f.type == selector);
  if (isFunction(selector))
    return selector;
  return (f => false); // This handler will never match with any action
}

function getActionTypeFromFunctionName(methodName) {
  if (!isString(methodName))
    return undefined;
  if (!methodName.startsWith("on"))
    return methodName;
  var actionName = methodName.substring(2);
  return actionName.charAt(0).toLowerCase() + actionName.substring(1);
}

function resolveAppFuncs(apps, context) {
  const appFuncs = [];
  const stateRefinements = [];
  each(apps, a => {
    var appFuncsObj = a(context);
    forOwn(appFuncsObj, (val, key) => {
      var selector = getActionTypeFromFunctionName(key);
      if (selector)
        appFuncs.push({ selector, func: val });
      if (key.startsWith('refine') || key.startsWith('monitor'))
        stateRefinements.push(val);
    });
  });
  return {appFuncs, stateRefinements};
}