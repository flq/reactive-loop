import React, { Component, PropTypes, Children } from 'react';
import appInit from './appInit';

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
    return Children.only(this.props.children);
  }
}

ReaxConnector.propTypes = {
  app: PropTypes.object.isRequired
};

ReaxConnector.childContextTypes = {
  dispatch: PropTypes.func.isRequired,
  state: PropTypes.func.isRequired
};