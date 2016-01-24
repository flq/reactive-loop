import {appInit,appBuilder} from '../reax.app';
import {assert} from 'chai';
import {Observable} from 'rx';

describe('appInit', ()=> {
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

});