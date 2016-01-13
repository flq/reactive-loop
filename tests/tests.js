import * as Rx from 'rx';
import {assert} from 'chai';

describe('obs tests', ()=> {
  it('have a way to feed back state', ()=> {
    var {dispatchAction, actionObservable} = actionSource();
    var count = 0;
    actionObservable.subscribe((t) => count++);
    dispatchAction('foo');
    assert.equal(count, 1);
  });
  it('can be combined', (cb)=> {

    function appFunc(state, item) {
      console.log("I am called");
      return Promise.resolve({ count: state.count + item.payload});
    }

    var initialState = {count: 0 };
    var {dispatchAction, actionObservable} = actionSource();
    var {dispatchState, getCurrentState, stateObservable} = stateSource(initialState);

    var zippedObs = Rx.Observable
    .zip(
      actionObservable, 
      stateObservable, 
      (item, state) => { return {item, state}})
    .flatMap(({item,state}) => appFunc(state, item))
    .do(newState => dispatchState(newState));

    zippedObs.subscribe((t) => { /* not important */ });
    dispatchAction({ payload: 3 });
    setTimeout(()=> {
      assert.equal(getCurrentState().count, 3);
      cb();
    }, 200);
    
    //dispatchAction({ payload: 4 });
    //assert.equal(getCurrentState().count, 7);
  });

});

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

