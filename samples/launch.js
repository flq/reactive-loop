import React from 'react';
import ReactDom from 'react-dom';
import {Observable} from 'rx';
import {assign} from 'lodash';
import {ReaxConnector, connect} from '../reax.react';
import {appBuilder} from '../reax.app';

const { Component, PropTypes, Children } = React;

const MAX_COUNT = 10;

const app = appBuilder()
      .setInitialState({counter: MAX_COUNT, countdownRunning: false, launched: false })
      .addAppFunc('launch', (s, a, d) => { 
        d(Observable
          .timer(1000,1000)
          .take(MAX_COUNT)
          .takeWhile(_ => s().countdownRunning)
          .map(_ => ({ type: 'tick', increment: 1 })));
        return assign({},s(), { countdownRunning: true });
      })
      .addAppFunc('cancel', s => {
        return assign({},s(), { countdownRunning: false });
      })
      .addAppFunc('reset', (s,a,d) => {
        d(Observable
          .timer(200,200)
          .take(MAX_COUNT - s().counter)
          .map(_ => ({ type: 'tick', increment: -1 })));
      })
      .addAppFunc('tick', (s, a) => {
        const {countdownRunning, counter} = s();
        return assign({},s(), {counter: counter - a.increment});
      })
      .addStateSugar(s => {
        const {countdownRunning, launched, counter} = s;
        const isInCancellableRange = counter > 3 && counter < MAX_COUNT;
        let ui = {
          launcherTriggerEnabled: !countdownRunning && !launched && counter == MAX_COUNT,
          cancelTriggerEnabled: countdownRunning && isInCancellableRange,
          resetTriggerEnabled: !countdownRunning && !launched && counter < MAX_COUNT
        }
        return assign({},s, { ui });
      })
      .addStateSugar(s => {
        const {countdownRunning, counter} = s;
        if (countdownRunning && counter == 0)
          return assign({},s, { countdownRunning: false, launched: true })
      })
      .build();

const DispatcherButton = connect(({label,type,dispatch,...other}) =>
{
  return (<input 
      type="button" 
      value={label}
      onClick={()=>dispatch({ type })}
      {...other} />);
});

const If = ({condition, children}) => {
   return condition ? children : <span/>;
};


const App = connect(({ui, counter, launched}) =>
  (<div>
    <p>{counter}</p>
    <If condition={launched}>
      <p>LAUNCHED!</p>
    </If>
    <p>
      <DispatcherButton disabled={!ui.launcherTriggerEnabled} label="Launch!" type="launch" />
      <DispatcherButton disabled={!ui.cancelTriggerEnabled} label="Cancel" type="cancel" />
      <DispatcherButton disabled={!ui.resetTriggerEnabled} label="Reset" type="reset" />
    </p>
  </div>), state => state);

global.App = {
  init(renderTarget) {
    ReactDom.render(
      <ReaxConnector app={app}>
        <App/>
      </ReaxConnector>, renderTarget);
  }
}