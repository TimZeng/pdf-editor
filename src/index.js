import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/app';

// Setup server endpoint
const isDev = window.location.hostname === 'localhost';
const devServer = 'http://localhost:3000';
const prodServer = '';

ReactDOM.render(
  <App endpoint={isDev ? devServer : prodServer} />,
  document.querySelector('.app')
);
