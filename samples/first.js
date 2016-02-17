import React from 'react';
import ReactDom from 'react-dom';
import {Observable} from 'rx';
import {assign} from 'lodash';
import {ReaxConnector, connect} from '../reax.react';
import {appBuilder} from '../reax.app';

const { Component, PropTypes, Children } = React; 

const HelloWorld = connect(({count}) => (<p>Hello from App! - {count}</p>), s => s);

const Button = connect(({id,label,dispatch}) => (
  <input 
    type="button" 
    value={label}
    onClick={()=>dispatch({ type: id })} />));

global.App = {
  init(renderTarget) {

    const app = appBuilder()
      .addAppFunc('sproink', (s, a) => { return { count: s().count + 1 } })
      .setInitialState({count: 0})
      .build();

    ReactDom.render(
      <ReaxConnector app={ app }>
        <Button id="sproink" label="Cause a hubbub" />
        <HelloWorld />
      </ReaxConnector>, renderTarget);
  }
}