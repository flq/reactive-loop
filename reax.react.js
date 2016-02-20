import React from 'react';
const { Component, PropTypes, Children } = React;
import {Subject,Observable} from 'rx';
import {assign} from 'lodash';
import {appInit} from './reax.app';

export class ReaxConnector extends Component {
  
  constructor(props) {
    super(props);
    const { dispatchAction, getCurrentState, stateObservable } = appInit(props.app);
    
    this.getCurrentState = getCurrentState;
    this.stateObservable = stateObservable;
    this.dispatchAction = dispatchAction;
    this.state = getCurrentState();
  }

  componentWillMount() {
    this.stateObservable.subscribe(s => this.setState(s));
  }

  getChildContext() {
    return { 
      dispatch: (msg) => this.dispatchAction(msg),
      state: () => this.getCurrentState()
    }
  }

  render() {
    return React.createElement("div",{}, this.props.children);
  }
}

ReaxConnector.propTypes = {
  app: PropTypes.object.isRequired
};

ReaxConnector.childContextTypes = {
  dispatch: PropTypes.func.isRequired,
  state: PropTypes.func.isRequired
};

export function connect(ReactComponent, stateSelector = s => {}) {
  
  class Wrapper extends Component {
    componentWillMount() {
      this.nextProps = this.constructProps();
    }

    componentWillUpdate(nextProps) {
     this.nextProps = this.constructProps(nextProps); 
    }

    constructProps(nextProps) {
      return assign(
        {}, 
        this.props,
        nextProps, 
        stateSelector(this.context.state()), 
        { dispatch: this.context.dispatch});
    }

    render() {
      return <ReactComponent {...this.nextProps} />
    }
  }
  Wrapper.contextTypes = {
    dispatch: PropTypes.func.isRequired,
    state: PropTypes.func.isRequired
  }

  return Wrapper;
}
