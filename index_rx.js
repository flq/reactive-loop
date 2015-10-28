import React from 'react';
import ReactDom from 'react-dom';
import {Observable,Subject} from 'rx';
import {assign} from 'lodash';

const { Component, PropTypes, Children } = React;

class RxConnector extends Component {
  
  constructor(props) {
    super(props);
    this.source = new Subject();
    var stateSource = props.actionSourceConnector(this.source);
    stateSource.take(1).subscribe(s => this.state = s);
    stateSource.subscribe(s => this.setState(s));
  }

  getChildContext() {
    return { 
      dispatch: (msg) => this.source.onNext(msg),
      globalState: () => this.state
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
  globalState: PropTypes.func.isRequired
}; 

class HelloWorld extends Component {
  render() {
    return (<p>Hello from App! - {this.context.globalState().count}</p>);
  }
}
HelloWorld.contextTypes = {
  globalState: PropTypes.func.isRequired
}

class Button extends Component {
  render() {
    return (<input type="button" 
          value={this.props.label} 
            onClick={this.handleClick.bind(this)}>
      </input>);
  }

  handleClick(e) {
    this.context.dispatch({ type: this.props.id });
  }
}
Button.contextTypes = {
  dispatch: PropTypes.func.isRequired
}

global.App = {
  init(renderTarget) {

    var state = {count: 0},
        stateSource = new Subject();

    function connectToActionSource(actionSource) {
      return Observable.concat(Observable.return(state),
        actionSource
        .filter(m => m.type == "sproink")
        .select(()=> assign(state, {count: state.count + 1})));
    }

    ReactDom.render(
      <RxConnector actionSourceConnector={ connectToActionSource }>
        <Button id="sproink" label="Cause a Hubbub" />
        <HelloWorld count={state.count} />
      </RxConnector>, renderTarget);
  }
}