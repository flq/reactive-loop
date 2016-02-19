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
        d(Observable.timer(1000,1000).take(MAX_COUNT).map(_ => ({ type: 'tick' })));
        return assign(s(), { countdownRunning: true });
      })
      .addAppFunc('tick', (s, a) => {
        const {countdownRunning, counter} = s();
        if (countdownRunning)
          return assign(s(), {counter: counter - 1})
      })
      .addStateSugar(s => {
        const {countdownRunning, launched} = s;
        let ui = {};
        ui.isLauncherDisabled = countdownRunning || launched;
        return assign(s, { ui });
      })
      .addStateSugar(s => {
        const {countdownRunning, counter} = s;
        if (countdownRunning && counter == 0)
          return assign(s, { countdownRunning: false, launched: true })
      })
      .build();

const DispatcherButton = connect(({label,type,dispatch,...other}) =>
  (<input 
    type="button" 
    value={label}
    onClick={()=>dispatch({ type })}
    {...other} />));

const If = ({condition, children}) => {
   return condition ? children : <span/>;
};


const App = connect(({ui, counter, launched}) => (
  <div>
    <p>{counter}</p>
    <If condition={launched}>
      <p>LAUNCHED!</p>
    </If>
    <p>
      <DispatcherButton disabled={ui.isLauncherDisabled} label="Launch!" type="launch" />
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