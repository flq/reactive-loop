import {Observable,Subject} from 'rx';
import {concat, map, each, isString, isFunction} from 'lodash';


export function appBuilder() {
  const appFuncs = [];
  const asyncAppFuncs = [];
  const actionObservables = [];
  let initialState = {};
  const builder = {
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
    setInitialState(state) {
      initialState = state;
      return builder;
    },
    build() {
      return {appFuncs, asyncAppFuncs, actionObservables, initialState};
    }
  };
  return builder;
}

export function appInit(app) {
  
  const { dispatchAction, actionObservable } = actionSource();
  const stateObservable = new Subject();
  let currentState = app.initialState;
  stateObservable.subscribe(s => currentState = s);

  const additionalContext = {
    dispatch: dispatchAction,
    getState: ()=> currentState
  };
  
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

  Observable
    .merge(allSyncStates.concat(allAsyncStates))
    .subscribe((state)=>stateObservable.onNext(state));
 
  // we put the initial state on the observable which is
  // picked up by the zip calls. However, this means that people
  // who subscribe to the state observable will not get to see the initial state.
  stateObservable.onNext(app.initialState);
 
  each(app.actionObservables, o => o.subscribe(msg => dispatchAction(msg)));

  return {
    getCurrentState() { return currentState; },
    stateObservable,
    actionObservable,
    dispatchAction
  };
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

function actionSource() { 
  var actionObservable = new Subject();
  return { 
    dispatchAction(action) { actionObservable.onNext(action) }, 
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