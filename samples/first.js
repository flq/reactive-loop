import React from 'react';
import ReactDom from 'react-dom';
import {Observable} from 'rx';
import {assign} from 'lodash';
import {appBuilder, ReaxConnector, connect} from '../src/index';

const { Component, PropTypes, Children } = React; 

const HelloWorld = connect(({count}) => (<p>Hello from App! - {count}</p>), s => s);

const Button = connect(({id,label,dispatch}) => (
  <input 
    type="button" 
    value={label}
    onClick={()=>dispatch({ type: id })} />));

function undoApp() {

  const stateStack = [];

  return {
    onUndo(s,a,d) {
      stateStack.pop(); // current
      var last = stateStack.pop();
      return last;
    },
    monitorState(s) {
      stateStack.push(s);
    }
  }
}

global.App = {
  init(renderTarget) {

    const app = appBuilder()
      .addApp(undoApp)
      .addAppFunc('sproink', (s, a) => { return { count: s().count + 1 } })
      .setInitialState({count: 0})
      .build();

    ReactDom.render(
      <ReaxConnector app={ app }>
        <div>
          <Button id="sproink" label="Cause a hubbub" />
          <Button id="undo" label="Undo" />
          <HelloWorld />
        </div>
      </ReaxConnector>, renderTarget);
  }
}