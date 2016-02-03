import {appInit,appBuilder} from '../reax.app';
import {assert} from 'chai';
import {Observable} from 'rx';

describe('appInit supports', ()=> {
  it('simple appFunc', ()=> {
    
    const app = appBuilder()
      .addAppFunc('foo', (state, item) => { return { count: state().count + 1 } })
      .setInitialState({ count: 0 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    
    dispatchAction({ type: 'foo' });
    assert.equal(getCurrentState().count, 1);
  });

  it('two appFuncs', ()=> {
    
    const app = appBuilder()
      .addAppFunc('foo', (state, item) => { return { count: state().count + 1 } })
      .addAppFunc('bar', (state, item) => { return { count: state().count + 3 } })
      .setInitialState({ count: 0 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    
    dispatchAction({ type: 'foo' });
    assert.equal(getCurrentState().count, 1);
    dispatchAction({ type: 'bar' });
    assert.equal(getCurrentState().count, 4);
    dispatchAction({ type: 'foo' });
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
    dispatchAction({ type: 'foo' });
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
    dispatchAction({ type: 'foo'});
    assert.equal(getCurrentState().count, 3);
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
})