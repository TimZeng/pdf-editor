import React, { Component } from 'react';
import axios from 'axios';
import { Document, Page } from 'react-pdf/build/entry.webpack';

class PDFDisplay extends Component {
  state = {
    file: '',
    pageNumber: null,
    numPages: null,
    x: 0,
    y: 0,
    documentReady: false,
    documentHeight: 0,
    params: {

    }
  }

  onFileChange = (event) => {
    this.setState({
      file: event.target.files[0],
      documentHeight: 0,
      documentReady: false,
      params: {}
    });
  }

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({
      numPages,
      pageNumber: null,
      documentReady: true
    })

  }

  changePage = by =>
    this.setState(prevState => ({
      pageNumber: prevState.pageNumber + by,
    }))

  _onMouseMove(e) {
    let { documentReady, documentHeight } = this.state;
    if ( documentReady && !documentHeight ) {
      const content = document.querySelector('.ReactPDF__Page__textContent');
      documentHeight = Number(content.style.height.replace(/\D/g,''));
    }
    const position = this.refs.elem.getDOMNode().getBoundingClientRect();
    this.setState({
      x: e.nativeEvent.offsetX,
      y: documentHeight - e.nativeEvent.offsetY,
      documentHeight
    });
  }

  recordPosition(e) {
    let { documentReady, documentHeight, params } = this.state;

    if ( documentReady && !documentHeight ) {
      const content = document.querySelector('.ReactPDF__Page__textContent');
      documentHeight = Number(content.style.height.replace(/\D/g,''));
    }

    const position = this.refs.elem.getDOMNode().getBoundingClientRect();
    const x = e.nativeEvent.offsetX;
    const y = documentHeight - e.nativeEvent.offsetY;

    if (documentReady) {
      if ( !!params.x && !!params.y ) {
        params.width = Number(x) - params.x;
        params.height = Number(y) - params.y;
      } else {
        params.x = Number(x);
        params.y = Number(y);
      }

      this.setState({ documentHeight, params });
    }
  }

  updateParams(color, pageSize) {
    let { params } = this.state;
    params.color = color;
    params.pageSize = Number(pageSize);
    this.setState({ params });
  }

  submit() {
    const { x, y, width, height, color, pageSize } = this.state.params;
    if ( !!x && !!y && !!width && !!height && !!color && !!pageSize ) {
      axios.post('/pdf', { x, y, width, height, color, pageSize })
      .then((response) => {
        if (response.status === 200) {
          window.alert('Success!');
        }
      });
    }
  }

  render() {
    const { file, numPages, x, y, documentHeight, params } = this.state;

    return (
      <div>
        <div className="Example__container__load">
          <label htmlFor="file">Load from file:</label>&nbsp;
          <input
            type="file"
            onChange={this.onFileChange}
          />
        </div>
        <p>Doc Height: {documentHeight}</p>
        <p>current: {x}, {y}</p>
        <p>X: {params.x}, Y: {params.y}, Wid: {params.width}, Hgt: {params.height}</p>
        <p>
          <span style={{backgroundColor:`${params.color}`,color:`${params.color}`}}>color</span>
          <input value={params.color} onChange={(e) => this.updateParams(e.target.value, params.pageSize)} />
        </p>

        <p>
          <span>Page Size (number of pages per ticket): </span>
          <input value={params.pageSize} onChange={(e) => this.updateParams(params.color, e.target.value)} />
        </p>

        <div onClick={this.submit.bind(this)}>submit</div>

        <div
          className="Example__container__document"
          onMouseMove={this._onMouseMove.bind(this)}
          onClick={this.recordPosition.bind(this)}
          ref="elem"
        >
          <Document
            file={file}
            onLoadSuccess={this.onDocumentLoadSuccess.bind(this)}
          >
            {
              Array.from(
                new Array(numPages),
                (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    onRenderSuccess={this.onPageRenderSuccess}
                  />
                ),
              )
            }
          </Document>
        </div>
      </div>
    );
  }
};

export default PDFDisplay;