import React, { Component } from 'react';
import axios from 'axios';
import { Document, Page } from 'react-pdf/build/entry.webpack';

class PDFDisplay extends Component {
  state = {
    file: '',
    pageNumber: null,
    numPages: null,
    documentReady: false,
    documentHeight: 0,
    documentWidth: 0,
    downloadPath: null,
    params: {
      pageSize: 1,
      activeIndex: 0,
      highlights: []
    }
  }

  onFileChange = (event) => {
    const context = this;

    const data = new FormData();

    data.append('file', event.target.files[0]);
    // Add any meta data needed
    data.append('name', 'file name');
    data.append('description', 'description of the file');

    axios.post(`${this.props.endpoint}/file`, data)
    .then(response => {
      if (response.status === 200) {
        window.alert('File upload success!');

        context.setState({
          file: `./${response.data.path}`,
          documentHeight: 0,
          documentReady: false,
          downloadPath: null,
          params: {
            pageSize: 1,
            activeIndex: 0,
            highlights: []
          }
        });
      }
    })
    .catch(err => {
      window.alert('File upload failed.');
    });
  }

  renderFileUploader() {
    return (
      <div className="Example__container__load">
        <label htmlFor="file">Load from file:</label>&nbsp;
        <input
          type="file"
          onChange={this.onFileChange}
        />
      </div>
    )
  }

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({
      numPages,
      pageNumber: null,
      documentReady: true
    })
  }

  recordPosition(e) {
    let { documentReady, documentHeight, documentWidth, params } = this.state;

    if ( documentReady && !documentHeight ) {
      const content = document.querySelector('.ReactPDF__Page__textContent');
      documentHeight = Number(content.style.height.replace('px',''));
      documentWidth = Number(content.style.width.replace('px',''));
    }

    const position = this.refs.elem.getDOMNode().getBoundingClientRect();
    const x = e.nativeEvent.offsetX;
    const y = documentHeight - e.nativeEvent.offsetY;

    if (documentReady) {
      params.highlights[params.activeIndex] = params.highlights[params.activeIndex] || {};
      if ( !!params.highlights[params.activeIndex].x && !!params.highlights[params.activeIndex].y ) {
        params.highlights[params.activeIndex].width = Number(x) - params.highlights[params.activeIndex].x;
        params.highlights[params.activeIndex].height = Number(y) - params.highlights[params.activeIndex].y;
      } else {
        params.highlights[params.activeIndex].x = Number(x);
        params.highlights[params.activeIndex].y = Number(y);
      }

      this.setState({ documentHeight, params, documentWidth });
    }
  }

  updateParams(index, color, pageSize) {
    let { params } = this.state;
    if ( index !== null && color !==null ) {
      params.highlights[index].color = color;
    }
    if ( !!pageSize ) {
      params.pageSize = Number(pageSize);
    }
    this.setState({ params });
  }

  renderParams() {
    const { documentWidth, documentHeight, params, downloadPath } = this.state;
    return (
      <div style={{position: 'absolute',backgroundColor:'#fff',top:'0',right:'0',padding:'15px',zIndex:'2'}}>
        <p>Doc Width: {documentWidth}, Doc Height: {documentHeight}</p>
        <div>
          <div>Page Size (number of pages per ticket): </div>
          <input value={params.pageSize} onChange={(e) => this.updateParams(null, null, e.target.value)} />
        </div>

        {
          params.highlights.map((hl, i) => this.renderParamHL(hl, i))
        }

        { this.renderButtons() }

      </div>
    )
  }

  renderButtons() {
    const { params, downloadPath } = this.state;
    const paramsReady = !!params.highlights[params.activeIndex] && !!params.highlights[params.activeIndex].color;
    const downloadReady = !!downloadPath;
    return(
      <div>
        <hr />
        <center
          style={{backgroundColor:`${paramsReady?'black':'grey'}`,color:'#fff',marginBottom:'10px'}}
          onClick={paramsReady?() => this.setState({params: {...params, activeIndex: params.activeIndex + 1}}):null}>
          + ADD
        </center>

        <center
          style={{backgroundColor:`${paramsReady?'black':'grey'}`,color:'#fff',marginBottom:'10px'}}
          onClick={paramsReady?() => this.submit():null}>
          Submit
        </center>

        <a
          style={{display:'block',lineHeight:'24px',width:'100%',backgroundColor:`${downloadReady?'black':'grey'}`,color:'#fff'}}
          href={downloadPath} download
          >Download
        </a>
      </div>
    )
  }

  renderParamHL(hl,i) {
    return (
      <div key={i}>
        <hr />
        <p>X: {hl.x}, Y: {hl.y}, Wid: {hl.width}, Hgt: {hl.height}</p>
        <p>
          <span style={{backgroundColor:`${hl.color}`,color:`${hl.color}`}}>color</span>
          <input value={hl.color} onChange={(e) => this.updateParams(i, e.target.value)} />
        </p>
      </div>
    )
  }

  renderHighlighBlock(documentWidth, documentHeight, hl) {
    return (
      <div key={`${hl.x}-${hl.y}-${hl.width}`} style={{
        position:'absolute',
        width:`${hl.width}`,
        height:`${hl.height}`,
        backgroundColor:`${hl.color || 'red'}`,
        zIndex:'2',
        left: `calc((100vw - ${documentWidth}px) / 2 - 10px + ${hl.x}px)`,
        top: `${documentHeight - hl.y - hl.height + 96}px`
      }}/>
    )
  }

  submit() {
    const { x, y, width, height, color } = this.state.params.highlights[this.state.params.activeIndex];
    const { file } = this.state;
    const context = this;
    if ( !!x && !!y && !!width && !!height && !!color ) {
      axios.post(`${this.props.endpoint}/edit`, {...this.state.params, file: file.slice(2)})
      .then((response) => {
        if (response.status === 200) {
          context.setState({ downloadPath: response.data });
          window.alert('Edit Success!');
        }
      });
    }
  }

  render() {
    const { file, numPages, x, y, documentHeight, documentWidth, params } = this.state;

    return (
      <div>

        { this.renderFileUploader() }
        { this.renderParams() }

        <div
          className="Example__container__document"
          onClick={this.recordPosition.bind(this)}
          ref="elem"
        >
          <Document
            file={file}
            onLoadSuccess={this.onDocumentLoadSuccess.bind(this)}
          >
            {
              params.highlights.map(
                hl => this.renderHighlighBlock(documentWidth,documentHeight,hl)
              )
            }
            {
              Array.from(
                new Array(numPages),
                (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
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