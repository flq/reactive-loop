import {Observable,Subject} from 'rx';
import {concat, map, each} from 'lodash';


export function appBuilder() {
  const appFuncs = [];
  const asyncAppFuncs = [];
  const actionObservables = [];
  let initialState = {};
  const builder = {
    addAppFunc(type, func) {
      appFuncs.push({ type, func });
      return builder;
    },
    addAsyncAppFunc(type, async) {
      asyncAppFuncs.push({ type, async });
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
  
  var allSyncStates = map(app.appFuncs, (appFunc) => {
    return actionObservable
      .filter(f => f.type == appFunc.type)
      .withLatestFrom(stateObservable, (action, state) => { return { state, action } })
      .map(wrapFuncWithErrorDispatch(appFunc.func, dispatchAction));
  });
  var allAsyncStates = map(app.asyncAppFuncs, (appFunc) => {
    return actionObservable
      .filter(f => f.type == appFunc.type)
      .withLatestFrom(stateObservable, (action, state) => { return { state, action } })
      .map(({state,action}) => appFunc
        .async(state,action)
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

function wrapFuncWithErrorDispatch(appFunc, dispatchAction) {
  return ({ state, action}) => {
    try {
      return appFunc(state, action)
    }
    catch (e) {
      dispatchAction({ type: 'error', whileHandling: action, error: e });
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