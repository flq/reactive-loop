import * as Rx from 'rx';
import {assert} from 'chai';
import {assign as reaxAssign} from '../src/index'

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
    stateObservable.skip(1).subscribe(s => {
      assert.equal(s.count, 3);
      cb();
    });
    dispatchAction({ payload: 3 });
    
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

describe('own assign', ()=> {
  it('does create a new object', ()=> {
    let obj = { val: "One" };
    let obj2 = reaxAssign(obj, { valTwo: "Two" }, { ui: { sth: true } });
    assert.deepEqual(obj2, {
      val: "One",
      valTwo: "Two",
      ui: {
        sth: true
      }
    });
    assert.notStrictEqual(obj, obj2);
  });
});

