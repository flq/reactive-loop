import {Observable} from 'rx';
import {appInit,appBuilder} from '../src/index';
import {assert} from 'chai';
import {testRig, fooAct, countUp} from './_testSupport';

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
});