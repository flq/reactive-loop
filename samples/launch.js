import React from 'react';
import ReactDom from 'react-dom';
import {Observable} from 'rx';
import {ReaxConnector, connect} from '../reax.react';
import {appBuilder, assign} from '../reax.app';

const { Component, PropTypes, Children } = React;

const COUNTER_START = 10;
const POINT_OF_NO_RETURN = 4;

function launchAppFuncs() {
  return {
    onInitLaunch(s,a,d) {
      d(Observable
        .timer(1000,1000)
        .take(COUNTER_START)
        .takeWhile(_ => s().countdownRunning)
        .map(_ => ({ type: 'tick', increment: 1 })));
      return assign(s(), { countdownRunning: true });
    },
    onResetCounter(s,a,d) {
      d(Observable
        .timer(200,200)
        .take(COUNTER_START - s().counter)
        .map(_ => ({ type: 'tick', increment: -1 })));
    },
    onCancelLaunch(s) {
      return assign(s(), { countdownRunning: false });
    },
    onTick(s, a) {
      const {countdownRunning, counter} = s();
      return assign(s(), {counter: counter - a.increment});
    }
  }
}

function launchStateRefinements() {
  return {
    refineUi(s) {
      const {countdownRunning, launched, counter} = s;
      const isInCancellableRange = counter > POINT_OF_NO_RETURN && counter < COUNTER_START;
      let ui = {
        launcherTriggerEnabled: !countdownRunning && !launched && counter == COUNTER_START,
        cancelTriggerEnabled: countdownRunning && isInCancellableRange,
        resetTriggerEnabled: !countdownRunning && !launched && counter < COUNTER_START
      }
      return assign(s, { ui });
    },
    refineIsLaunched(s) {
      const {countdownRunning, counter} = s;
      if (countdownRunning && counter == 0)
        return assign(s, { countdownRunning: false, launched: true })
    }
  }
}

const app = appBuilder()
  .setInitialState({counter: COUNTER_START, countdownRunning: false, launched: false })
  .addApp(launchAppFuncs)
  .addApp(launchStateRefinements)
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
      <DispatcherButton disabled={!ui.launcherTriggerEnabled} label="Launch!" type="initLaunch" />
      <DispatcherButton disabled={!ui.cancelTriggerEnabled} label="Cancel" type="cancelLaunch" />
      <DispatcherButton disabled={!ui.resetTriggerEnabled} label="Reset" type="resetCounter" />
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