import {appInit,appBuilder} from '../reax.app';
import {assert} from 'chai';
import {Observable} from 'rx';

describe('appInit sync', ()=> {
  it('supports simple appFunc', ()=> {
    
    const app = appBuilder()
      .addAppFunc('foo', (s, item) => { return { count: s.count + 1 } })
      .setInitialState({ count: 0 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    
    dispatchAction({ type: 'foo' });
    assert.equal(getCurrentState().count, 1);
  });

  it('supports two appFuncs', ()=> {
    
    const app = appBuilder()
      .addAppFunc('foo', (s, item) => { return { count: s.count + 1 } })
      .addAppFunc('bar', (s, item) => { return { count: s.count + 3 } })
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

  it('supports action sources', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (s, item) => { return { count: s.count + 1 } })
      .addActionSource(Observable.return({ type:'foo' }))
      .setInitialState({ count: 0 })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app);
    assert.equal(getCurrentState().count, 1);
  });

  it('supports async app funcs', (cb)=> {
    const app = appBuilder()
      .addAsyncAppFunc('foo', (s,item) => Promise.resolve({ count: s.count + 1 }))
      .setInitialState({ count: 0 })
      .build();
    let {dispatchAction,stateObservable} = appInit(app);
    
    stateObservable.subscribe(s => {
      assert.equal(s.count, 1);
      cb();
    });
    dispatchAction({ type: 'foo' });
  });

});

describe('appInit with exceptions', ()=> {
  it('supports a dying app func', ()=> {
    const app = appBuilder()
      .addAppFunc('foo', (s, item) => { 
        if (item.die)
          throw new Error("die");
        else
          return { count: s.count + 1 };
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
      .addAppFunc('foo', (s, item) => { throw new Error("die"); })
      .addAppFunc('error', (s, item) => error = item)
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
      .addAsyncAppFunc('foo', (s,item) => Promise.reject(Error("argh")))
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
})