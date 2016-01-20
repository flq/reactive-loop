import * as Rx from 'rx';
import {assign, map, each} from 'lodash';

export default function appFuncInit(appFunc, initialState = {}) {
  const { dispatchState, getCurrentState, stateObservable } = stateSource(initialState);
  const { dispatchAction, actionObservable } = actionSource();
  
   var zippedObs = Rx.Observable
    .zip(
      actionObservable, 
      stateObservable, 
      (item, state) => { return {item, state}})
    .flatMap(({item,state}) => appFunc(state, item))
    .do(newState => dispatchState(newState));

    zippedObs.subscribe((t) => { /* not important */ });
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