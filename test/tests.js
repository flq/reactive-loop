import {appInit,appBuilder, assign as reaxAssign} from '../reax.app';
import {assert} from 'chai';
import {Observable} from 'rx';
import {assign} from 'lodash';

describe('appInit supports', ()=> {

  const fooAct = { type: 'foo' };

  it('simple appFunc', ()=> {
    
    const app = appBuilder()
      .addAppFunc('foo', (state, item) => { return { count: state().count + 1 } })
      .setInitialState({ count: 0 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    
    dispatchAction(fooAct);
    assert.equal(getCurrentState().count, 1);
  });

  it('two appFuncs', ()=> {
    
    const app = appBuilder()
      .addAppFunc('foo', (state, item) => { return { count: state().count + 1 } })
      .addAppFunc('bar', (state, item) => { return { count: state().count + 3 } })
      .setInitialState({ count: 0 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    
    dispatchAction(fooAct);
    assert.equal(getCurrentState().count, 1);
    dispatchAction({ type: 'bar' });
    assert.equal(getCurrentState().count, 4);
    dispatchAction(fooAct);
    assert.equal(getCurrentState().count, 5);
  });

  it('action sources', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (state, item) => { return { count: state().count + 1 } })
      .addActionSource(Observable.return({ type:'foo' }))
      .setInitialState({ count: 0 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    assert.equal(getCurrentState().count, 1);
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
    const app = appBuilder()
      .addAppFunc(
        a => a.type.startsWith('f'), 
        (state,item) => ({ count: state().count + 1 }))
      .setInitialState({ count: 0 })
      .build();
    
    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction({type: 'ar'});
    dispatchAction({type: 'foo'});
    dispatchAction({type: 'fa'});
    assert.equal(getCurrentState().count, 2);
  });

  it('appfuncs that want to dispatch', ()=> {
    
    const app = appBuilder()
      .addAppFunc('foo', (state,item) => ({ count: state().count * 2 }))
      .addAppFunc('bar', (state,item,dispatch) => {
        dispatch({type: 'foo'});
        return { count: state().count + 1 };
      })
      .setInitialState({ count: 1 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction({ type: 'bar'});
    assert.equal(getCurrentState().count, 3);
  });

  it('multiple appfuncs on same action, in sequence of addition', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (state,item) => ({ count: state().count * 2 }))
      .addAppFunc('foo', (state,item) => ({ count: state().count + 1 }))
      .setInitialState({ count: 1 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction(fooAct);
    assert.equal(getCurrentState().count, 3);
  });

  it('ignoring appfuncs returning undefined', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (state,item) => {
        const whatevs = { count: state().count * 2 };
        //Not returning anything, cause I have nothing to say
      })
      .setInitialState({ count: 1 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction(fooAct);
    assert.equal(getCurrentState().count, 1); 
  });

  it('state sugar to enrich state', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (s,a) => ({ count: s().count + 1 }))
      .addStateRefinement(s => ({ count: s.count * 2 }))
      .setInitialState({ count: 1 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction(fooAct);
    // s1 (1) -> sugar -> s2 (2) -> foo -> s3 (3) -> sugar -> s4 (6)
    assert.equal(getCurrentState().count, 6); 
  });

  it('calling state sugar AFTER the action-based mutation', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (s,a) => ({ count: s().count + 1 }))
      .addStateRefinement(s => s.count == 2 ? assign(s, { seeState: true }) : s)
      .setInitialState({ count: 1 })
      .build();
    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction(fooAct);
    assert.isTrue(getCurrentState().seeState); 
  });

  it('multiple sugar to enrich state', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (s,a) => ({ count: s().count + 1 }))
      .addStateRefinement(s => ({ count: s.count * 2 }))
      .addStateRefinement(s => ({ count: s.count + 1 }))
      .setInitialState({ count: 1 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction(fooAct);
    // (1) -> sg1 -> (2) -> sg2 -> (3) -> foo -> (4) -> sg1 -> (8) -> sg2 -> (9)
    assert.equal(getCurrentState().count, 9); 
  });

  it('dispatching an observable', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (s,a) => ({ count: s().count + 1 }))
      .addAppFunc('bar', (s,a,d) => d(Observable.fromArray([fooAct, fooAct])))
      .setInitialState({ count: 1 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction({ type: 'bar' });
    assert.equal(getCurrentState().count, 3);
  });

});

describe('appInit with problems', ()=> {
  it('ignores state Sugar that returns nothing', ()=> {
    const app = appBuilder()
      .addStateRefinement(s => {if (s.count > 1) return { count: 5}; })
      .setInitialState({ count: 1})
      .build();

    let {getCurrentState} = appInit(app);
    assert.isObject(getCurrentState());
    assert.equal(getCurrentState().count, 1);
  });

});

describe('appInit with exceptions', ()=> {
  it('supports a dying app func', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (state, item) => { 
        if (item.die)
          throw new Error("die");
        else
          return { count: state().count + 1 };
      })
      .setInitialState({ count: 0 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction({ type: 'foo', die: true });
    dispatchAction({ type: 'foo', die: false });
    assert.equal(getCurrentState().count, 1);
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

  it('supports dying sugar');

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
  })
});

describe('higher-level API', ()=> {
  it('supports adding app funcs', ()=> {
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

  it('supports adding state refinements', ()=> {
    var appFuncs = ()=> ({ 
      onFoo(s) { return { count: s().count + 1 } },
      refineState(s) { 
        s.refined = true;
        return s;
      }
    });

    const app = appBuilder()
      .addApp(appFuncs)
      .setInitialState({count: 1})
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    dispatchAction({ type: 'foo'});
    assert.isTrue(getCurrentState().refined);

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