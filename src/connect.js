import {assign} from 'lodash';
import React from 'react';
const { Component, PropTypes, Children } = React;

export default function connect(ReactComponent, stateSelector = s => {}) {
  
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