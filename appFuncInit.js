import * as Rx from 'rx';
import {assign, map, each} from 'lodash';

export default function appFuncInit(appFuncs, initialState = {}) {
  const { dispatchState, getCurrentState, stateObservable } = stateSource(initialState);
  const { dispatchAction, actionObservable } = actionSource();
  
  var allNewStates = map(appFuncs, (appFunc) => {
    var filtered = actionObservable.filter(f => f.type == appFunc.type);
    
    return Rx.Observable.zip(
      stateObservable,
      filtered,
      (state, action) => { return { state, action } })
    .map(({ state, action}) => appFunc.func(state, action))
  });
  
  Rx.Observable.merge(allNewStates).subscribe((state)=>dispatchState(state));
  
  return {
    getCurrentState,
    stateObservable,
    dispatchAction
  };
}

function stateSource(currentState) {
  
  var dispatch = undefined;
  var stateObservable = Rx.Observable.create(function(o) {
    o.onNext(currentState);
    dispatch = (nextState) => {
      o.onNext(nextState);
      currentState = nextState;
    }
  });

  return {
    dispatchState(newState) {
      dispatch(newState);
    },
    getCurrentState() {
      return currentState;
    },
    stateObservable
  };
}

function actionSource() {
  var dispatch = undefined;
  var actionObservable = Rx.Observable.create(function(o) {
    dispatch = (item) => o.onNext(item);
  });

  return { 
    dispatchAction(action) { dispatch(action) }, 
    actionObservable 
  };
}