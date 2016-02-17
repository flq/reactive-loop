import React from 'react';
import ReactDom from 'react-dom';
import {Observable} from 'rx';
import {assign} from 'lodash';
import {ReaxConnector, connect} from '../reax.react';
import {appBuilder} from '../reax.app';

const { Component, PropTypes, Children } = React; 

const HelloWorld = ({count}) => (<p>Hello from Launch! - {count}</p>);

global.App = {
  init(renderTarget) {
    ReactDom.render(<HelloWorld count="5" />, renderTarget);
  }
}