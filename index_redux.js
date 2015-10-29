import React from 'react';
import ReactDom from 'react-dom';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import {assign} from 'lodash';

const { Component, PropTypes, Children } = React;

class Button extends Component {
  render() {
    return (
      <input type="button" 
             value={this.props.label} 
             onClick={this.handleClick.bind(this)}>
      </input>);
  }

  handleClick(e) { 
    this.props.dispatch({type: 'INCREMENT'});
  }
}

class HelloWorld extends Component {
  render() {
    return (
      <p>Hello from App! - {this.props.count}</p>);
  }
}

function counter(state = { count: 0 }, action) {
  switch (action.type) {
  case 'INCREMENT':
    return assign({}, state, { count: state.count + 1 });
  default:
    return state;
  }
}

let store = createStore(counter);

global.App = {
  init(renderTarget) {
    
    var ConnectedButton = connect()(Button);
    var ConnectedHelloWorld = connect(s => { return {count: s.count} })(HelloWorld);

    ReactDom.render(
      <Provider store={store}>
        <div>
          <ConnectedButton label="Cause a Hubbub" />
          <ConnectedHelloWorld />
        </div>
      </Provider>, renderTarget);
  }
}