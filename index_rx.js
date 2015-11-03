import React from 'react';
import ReactDom from 'react-dom';
import {Observable} from 'rx';
import {assign} from 'lodash';
import {RxConnector, connect} from './reax';

const { Component, PropTypes, Children } = React; 

class HelloWorld extends Component {
  render() {
    return (<p>Hello from App! - {this.props.count}</p>);
  }
}

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

    var state = {count: 0};

    function connectToActionSource(actionSource) {
      return Observable.concat(
        Observable.return(state),
        actionSource
          .filter(m => m.type == "sproink")
          .select(()=> assign(state, {count: state.count + 1})));
    }

    ReactDom.render(
      <RxConnector actionSourceConnector={ connectToActionSource }>
        {[
          React.createElement(connect(Button), {id: "sproink", label: "Cause a hubbub"}, null),
          React.createElement(connect(HelloWorld, s => { return { count: s.count} }), {}, null)
        ]}
      </RxConnector>, renderTarget);
  }
}