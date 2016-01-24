import {Observable,Subject} from 'rx';
import {assign, map, each} from 'lodash';


export function appBuilder() {
  const appFuncs = [];
  const actionObservables = [];
  const builder = {
    addAppFunc(type, func) {
      appFuncs.push({ type, func });
      return builder;
    },
    addActionSource(actionObservable) {
      actionObservables.push(actionObservable);
      return builder;
    },
    build() {
      return {appFuncs, actionObservables};
    }
  };
  return builder;
}

export function appInit(app, initialState = {}) {
  
  const { dispatchAction, actionObservable } = actionSource();
  const stateObservable = new Subject();
  let currentState = initialState;
  stateObservable.subscribe(s => currentState = s);
  
  var allNewStates = map(app.appFuncs, (appFunc) => {
    
    return actionObservable
      .filter(f => f.type == appFunc.type)
      .withLatestFrom(stateObservable, (action, state) => { return { state, action } })
      .map(({ state, action}) => appFunc.func(state, action))
      //flatMap for observables and promises
  });
  
  Observable
    .merge(allNewStates)
    .subscribe((state)=>stateObservable.onNext(state));
  
  // We need to push the first state on the line
  stateObservable.onNext(initialState);

  each(app.actionObservables, o => o.subscribe(msg => dispatchAction(msg)));

  return {
    getCurrentState() { return currentState; },
    stateObservable,
    dispatchAction
  };
}

function actionSource() { 

  var actionObservable = new Subject();

  return { 
    dispatchAction(action) { actionObservable.onNext(action) }, 
    actionObservable 
  };
}