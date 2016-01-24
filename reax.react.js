import React from 'react';
import {Subject,Observable} from 'rx';
import {assign} from 'lodash';
const { Component, PropTypes, Children } = React;

export class RxConnector extends Component {
  
  constructor(props) {
    super(props);
    this.source = new Subject();
    this.stateSource = props.actionSourceConnector(this.source);
    this.state = {};
  }

  componentWillMount() {
    this.stateSource.subscribe(s => this.setState(s));
  }

  getChildContext() {
    return { 
      dispatch: (msg) => this.source.onNext(msg),
      state: () => this.state
    }
  }

  render() {
    return React.createElement("div",{}, this.props.children);
  }
}

RxConnector.propTypes = {
  actionSourceConnector: PropTypes.func.isRequired
};

RxConnector.childContextTypes = {
  dispatch: PropTypes.func.isRequired,
  state: PropTypes.func.isRequired
};

export function connect(ReactComponent, stateSelector = s => {}) {
  
  class Wrapper extends Component {
    componentWillMount() {
      this.nextProps = this.constructProps();
    }

    componentWillUpdate() {
     this.nextProps = this.constructProps(); 
    }

    constructProps() {
      return assign(
        {}, 
        this.props, 
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
