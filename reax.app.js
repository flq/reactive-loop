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

  populateApp(app, destructureApps(app.apps, additionalContext));

  const stateObservable = reduce(
     app.stateSugar,
     (agg, func) => agg.map(wrapStateSugarFunc(func, additionalContext)),
     stateSubject).share();

  stateObservable
    .subscribe(s => currentState = s);
  
  var allSyncStates = map(app.appFuncs, (appFunc) => {

    return actionObservable
      .filter(createAppFuncFilter(appFunc.selector))
      .withLatestFrom(stateObservable, (action, state) => ({ state, action }))
      .map(wrapFuncWithErrorDispatch(appFunc.func, additionalContext));
  });
  
  var allAsyncStates = map(app.asyncAppFuncs, (appFunc) => {
    return actionObservable
      .filter(createAppFuncFilter(appFunc.selector))
      .withLatestFrom(stateObservable, (action, state) => { return { state, action } })
      .map(({state,action}) => {
        try {
          return appFunc.async(additionalContext.getState, action, dispatchAction)
              .catch(e => {
                dispatchAction({ type: 'error', whileHandling: action, error: e });
                return state;
              })
        }
        catch(e) {
          return Promise.resolve(undefined);
        }
      })
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

function wrapStateSugarFunc(func, {dispatch}) {
  var result = undefined;
  return s => {
    try {
      result = func(s);
    }
    catch(e) {
      // O..kay. Consider the situation that the exception happens already with the very first state.
      // In this case, the error action cannot be matched with any state and the error handler 
      // would not be called. One solution is to delay the dispatch and let the state flow through
      // before the action goes its way.
      dispatch(Observable.just({ type: 'error', error: e }).delay(50));
    }
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

function destructureApps(apps, context) {
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

function populateApp(app, {appFuncs, asyncAppFuncs, stateRefinements, actionObservables}) {
  each(appFuncs, appFunc => app.appFuncs.push(appFunc));
  each(asyncAppFuncs, asyncFunc => app.asyncAppFuncs.push(asyncFunc));
  each(stateRefinements, refinement => app.stateSugar.push(refinement));
  each(actionObservables, obs => app.actionObservables.push(obs));
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