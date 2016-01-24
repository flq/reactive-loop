import {appInit,appBuilder} from '../reax.app';
import {assert} from 'chai';

describe('appFuncInit', ()=> {
  it('supports simple appFunc', ()=> {
    
    const app = appBuilder()
      .addAppFunc('foo', (s, item) => { return { count: s.count + 1 } })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app, { count: 0 });
    
    dispatchAction({ type: 'foo' });
    assert.equal(getCurrentState().count, 1);
  });

  it('supports two appFuncs', ()=> {
    
    const app = appBuilder()
      .addAppFunc('foo', (s, item) => { return { count: s.count + 1 } })
      .addAppFunc('bar', (s, item) => { return { count: s.count + 3 } })
      .build();

    let {dispatchAction,getCurrentState} = appInit(app, { count: 0 });
    
    dispatchAction({ type: 'foo' });
    assert.equal(getCurrentState().count, 1);
    dispatchAction({ type: 'bar' });
    assert.equal(getCurrentState().count, 4);
    dispatchAction({ type: 'foo' });
    assert.equal(getCurrentState().count, 5);
  });

});