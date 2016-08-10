import {appInit,appBuilder} from '../src/index';

export function testRig(appBuilderPipeline, initialState) {
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

export const fooAct = { type: 'foo' };
export const countUp = (s, a) => ({ count: s().count + 1 });