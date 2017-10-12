import React, { Component } from 'react';

import PDFDisplay from './PDFDisplay';

export default class App extends Component {
  render() {
    return (
      <div style={{backgroundColor:'grey'}}>
        <center className='container'>
          <h1>PDF Editor</h1>
          <PDFDisplay endpoint={this.props.endpoint} />
        </center>
      </div>
    );
  }
}
