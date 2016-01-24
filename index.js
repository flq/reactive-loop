import React from 'react';
import ReactDom from 'react-dom';
import {Observable} from 'rx';
import {assign} from 'lodash';
import {ReaxConnector, connect} from './reax.react';
import {appBuilder} from './reax.app';

const { Component, PropTypes, Children } = React; 

const HelloWorld = ({count}) => (<p>Hello from App! - {count}</p>);

class Button extends Component {
  render() {
    return (<input type="button" 
          value={this.props.label} 
            onClick={this.handleClick.bind(this)}>
      </input>);
  }

  handleClick(e) {
    this.props.dispatch({ type: this.props.id });
  }
}

global.App = {
  init(renderTarget) {

    const app = appBuilder()
      .addAppFunc('sproink', (s, a) => { return { count: s.count + 1 } })
      .setInitialState({count: 0})
      .build();

    ReactDom.render(
      <ReaxConnector app={ app }>
        {[
          React.createElement(connect(Button), {id: "sproink", label: "Cause a hubbub"}, null),
          React.createElement(connect(HelloWorld, s => { return { count: s.count} }), {}, null)
        ]}
      </ReaxConnector>, renderTarget);
  }
}