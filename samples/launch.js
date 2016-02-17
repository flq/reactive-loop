import React from 'react';
import ReactDom from 'react-dom';
import {Observable} from 'rx';
import {assign} from 'lodash';
import {ReaxConnector, connect} from '../reax.react';
import {appBuilder} from '../reax.app';

const { Component, PropTypes, Children } = React;


const app = appBuilder()
      .setInitialState({counter: 10, countdownRunning: false, launched: false })
      .addActionSource(Observable.timer(1000,1000).map(_ => { type: 'tick' }))
      .addAppFunc('launch', (s, a) => { return assign(s(), { countdownRunning: true }) })
      .addAppFunc('tick', (s, a) => {
        const {countdownRunning, counter} = s();
        if (countdownRunning)
          return assign(s(), {counter: counter - 1})
      })
      .addStateSugar(s => {
        const {countdownRunning, launched} = s();
        let ui = {};
        ui.isLauncherDisabled = countdownRunning || launched;
        return assign(s(), { ui });
      })
      .addStateSugar(s => {
        const {countdownRunning, counter} = s();
        if (countdownRunning && counter == 0)
          return assign(s(), { countdownRunning: false, launched: true })
      })
      .build();

const DispatcherButton = connect(({label,type,dispatch,...other}) => 
  (<input 
    type="button" 
    value={label}
    onClick={()=>dispatch({ type })}
    ...other />));

const App = connect(({ui,counter}) => (
  <div>
    <p>{counter}</p>
    <p>
      <DispatcherButton disabled="{!ui.isLauncherDisabled}" label="Launch!" type="launch" />
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