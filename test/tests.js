import {appInit,appBuilder, assign as reaxAssign} from '../reax.app';
import {assert} from 'chai';
import {Observable} from 'rx';
import {assign} from 'lodash';

function testRig(appBuilderPipeline, initialState) {
  const builder = appBuilderPipeline(appBuilder());
  builder.setInitialState(initialState || {count: 1});

  const instruments = appInit(builder.build());
  instruments.getCount = 
    (function(action) { 
      return this.getState(action).count; 
    }).bind(instruments);
  instruments.getState = 
    (function(action) { 
      this.dispatchAction(action);
      return this.getCurrentState(); 
    }).bind(instruments);
  return instruments;
}

const fooAct = { type: 'foo' };
const countUp = (s, a) => ({ count: s().count + 1 });

describe('appInit supports', ()=> {

  it('simple appFunc', ()=> {
    
    let {getCount} = testRig(b => b.addAppFunc('foo', countUp));
    
    assert.equal(getCount(fooAct),2);
  });

  it('two appFuncs', ()=> {
    
    const countThree = (state, item) => ({ count: state().count + 3 });

    let {getCount} = testRig(b => b.addAppFunc('foo',countUp).addAppFunc('bar',countThree));
    
    assert.equal(getCount(fooAct), 2);
    assert.equal(getCount({ type: 'bar' }), 5);
    assert.equal(getCount(fooAct), 6);
  });

  it('action sources', ()=> {

    let { getCurrentState} = testRig(b => b
      .addAppFunc('foo', countUp)
      .addActionSource(Observable.return({ type:'foo' })));

    assert.equal(getCurrentState().count, 2);
  });

  it('async app funcs', (cb)=> {
    const app = appBuilder()
      .addAsyncAppFunc('foo', (state,item) => Promise.resolve({ count: state().count + 1 }))
      .setInitialState({ count: 0 })
      .build();
    let {dispatchAction,stateObservable} = appInit(app);
    
    stateObservable.subscribe(s => {
      assert.equal(s.count, 1);
      cb();
    });
    dispatchAction(fooAct);
  });

  it('a func selector', ()=> {

    let {getCount} = testRig(b => b
      .addAppFunc(a => a.type.startsWith('f'), countUp));

    assert.equal(getCount({type: 'ar'}), 1);
    assert.equal(getCount({type: 'foo'}), 2);
    assert.equal(getCount({type: 'fa'}), 3);

  });

  it('appfuncs that want to dispatch', ()=> {
    
    const [multiply,dispatchFunc] = [
      (state,item) => ({ count: state().count * 2 }),
      (state,item,dispatch) => {
        dispatch({type: 'foo'});
        return { count: state().count + 1 };
      }];

    let {getCount} = testRig(b => b
      .addAppFunc('foo', multiply)
      .addAppFunc('bar', dispatchFunc));

    assert.equal(getCount({ type: 'bar'}), 3);
  });

  it('multiple appfuncs on same action, in sequence of addition', ()=> {
    const multiply = (state,item) => ({ count: state().count * 2 });
    
    let {getCount} = testRig(b => b
      .addAppFunc('foo', multiply)
      .addAppFunc('foo', countUp));

    assert.equal(getCount(fooAct), 3);
  });

  it('state sugar to enrich state', ()=> {

    let {getCount} = testRig(b => b
      .addAppFunc('foo',countUp)
      .addStateRefinement(s => ({ count: s.count * 2 })));

    // s1 (1) -> sugar -> s2 (2) -> foo -> s3 (3) -> sugar -> s4 (6)
    assert.equal(getCount(fooAct), 6); 
  });

  it('calling state sugar AFTER the action-based mutation', ()=> {

    let {getState} = testRig(b => b
      .addAppFunc('foo',countUp)
      .addStateRefinement(s => s.count == 2 ? assign(s, { seeState: true }) : s));

    assert.isTrue(getState(fooAct).seeState); 
  });

  it('multiple sugar to enrich state', ()=> {

    let {getCount} = testRig(b => b
      .addAppFunc('foo', countUp)
      .addStateRefinement(s => ({ count: s.count * 2 }))
      .addStateRefinement(s => ({ count: s.count + 1 })));

    // (1) -> sg1 -> (2) -> sg2 -> (3) -> foo -> (4) -> sg1 -> (8) -> sg2 -> (9)
    assert.equal(getCount(fooAct), 9); 
  });

  it('dispatching an observable', ()=> {

    let {getCount} = testRig(b => b
      .addAppFunc('foo', countUp)
      .addAppFunc('bar', (s,a,d) => d(Observable.fromArray([fooAct, fooAct]))));

    assert.equal(getCount({ type: 'bar' }), 3);
  });

});

describe('appInit with problems', ()=> {

  it('ignores state Sugar that returns nothing', ()=> {

    let {getCurrentState} = testRig(b => b
      .addStateRefinement(s => {if (s.count > 1) return { count: 5}; }));

    assert.isObject(getCurrentState());
    assert.equal(getCurrentState().count, 1);
  });

  it('ignores appfuncs returning undefined', ()=> {

    const noReturnVal = (state,item) => {
      const whatevs = { count: state().count * 2 };
      //Not returning anything, cause I have nothing to say
    };

    let {getCount} = testRig(b => b.addAppFunc('foo', noReturnVal));

    assert.equal(getCount(fooAct), 1);
  });

});

describe('appInit with exceptions', ()=> {
  it('supports a dying app func', ()=> {

    let {getCount} = testRig(b => b
      .addAppFunc('foo', (state, item) => { 
        if (item.die)
          throw new Error("die");
        else
          return { count: state().count + 1 };
      }));

    assert.equal(getCount({ type: 'foo', die: true }), 1);
    assert.equal(getCount({ type: 'foo', die: false }), 2);
  });

  it('converts an error to a dispatch', ()=> {
    let error = undefined;
    const app = appBuilder()
      .addAppFunc('foo', (state, item) => { throw new Error("die"); })
      .addAppFunc('error', (state, item) => error = item)
      .setInitialState({ count: 0 })
      .build();
    let {dispatchAction} = appInit(app);
    dispatchAction({ type: 'foo'});
    assert.isDefined(error);
    assert.equal(error.error.message, "die");
  });

  it('supports a rejected promise', (cb)=> {
    let error = undefined;
    const app = appBuilder()
      .addAsyncAppFunc('foo', (state,item) => Promise.reject(Error("argh")))
      .setInitialState({ count: 0 })
      .build();

    let {dispatchAction,actionObservable} = appInit(app);

    actionObservable
    .skipWhile(a => a.type == 'foo')
    .subscribe(a => {
      assert.equal(a.error.message, "argh");
      cb();
    });

    dispatchAction({ type: 'foo'});
  });

  it('supports errorListener API', ()=> {
    let error = undefined;
    const app = appBuilder()
      .addAppFunc('foo', (state, item) => { throw new Error("die"); })
      .addErrorListener((state, item) => { error = item; })
      .build();
    let {dispatchAction,actionObservable} = appInit(app);
    dispatchAction({ type: 'foo'});
    assert.isDefined(error);
    assert.equal(error.error.message, "die");
  });

  it('supports dying sugar');

  it ('supports misbehaved async func returning undefined');
});

describe('higher-level API', ()=> {
  it('supports adding app funcs (on...(s,a,d) : s)', ()=> {
    var appFuncs = ()=> ({ 
      onFoo(s) { return { count: s().count + 1 } } 
    });

    const app = appBuilder()
      .addApp(appFuncs)
      .setInitialState({count: 1})
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction({ type: 'foo'});

    assert.equal(getCurrentState().count, 2);
  });

  it('supports adding state refinements (monitor|refine...(s) : s)', ()=> {
    var appFuncs = ()=> ({ 
      onFoo: countUp,
      refineState(s) { 
        s.refined = true;
        return s;
      }
    });

    let {getState} = testRig(b => b.addApp(appFuncs));
    assert.isTrue(getState({ type: 'foo'}).refined);
  });

  it('supports adding action providers (dispatch...())', ()=> {
    var appFuncs = ()=> ({ 
      dispatchStuff() { return Observable.return({ type:'foo' }) },
      onFoo: countUp
    });

    let {getCurrentState} = testRig(b => b.addApp(appFuncs));
    assert.equal(getCurrentState().count, 2);
  });

  it('supportsAddingAsyncFuncs', (cb) => {

    const app = ()=> ({
      onFooAsync(state,item) { return Promise.resolve({ count: state().count + 1 }); }
    });

    let {dispatchAction,stateObservable} = testRig(b => b.addApp(app));
    
    stateObservable.subscribe(s => {
      assert.equal(s.count, 2);
      cb();
    });
    dispatchAction(fooAct);
  });
})

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