import appFuncInit from '../appFuncInit';
import {assert} from 'chai';

describe('appFuncInit', ()=> {
  it('supports simple appFunc', ()=> {
    
    let {dispatchAction,getCurrentState} = appFuncInit(
      [{ type: 'foo', func: (s, item) => { return { count: s.count + 1 } } }], 
      { count: 0 });
    
    dispatchAction({ type: 'foo' });
    assert.equal(getCurrentState().count, 1);
  });

  it('supports two appFuncs', ()=> {
    
    let {dispatchAction,getCurrentState} = appFuncInit(
      [
        { 
          type: 'foo', 
          func: (s, item) => { return { count: s.count + 1 } } 
        },
        { 
          type: 'bar', 
          func: (s, item) => { return { count: s.count + 3 } } 
        }
      ], 
      { count: 0 });
    
    dispatchAction({ type: 'foo' });
    assert.equal(getCurrentState().count, 1);
    dispatchAction({ type: 'bar' });
    assert.equal(getCurrentState().count, 4);
    dispatchAction({ type: 'foo' });
    assert.equal(getCurrentState().count, 5);
  });

});