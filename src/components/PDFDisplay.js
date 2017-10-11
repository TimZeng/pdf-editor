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
    documentWidth: 0,
    params: {
      pageSize: 1,
      activeIndex: 0,
      highlights: []
    }
  }

  onFileChange = (event) => {
    this.setState({
      file: event.target.files[0],
      documentHeight: 0,
      documentReady: false,
      params: {
        pageSize: 1,
        activeIndex: 0,
        highlights: []
      }
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
    const { documentWidth, documentHeight, params } = this.state;
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

        {
          !params.highlights[params.activeIndex] || !params.highlights[params.activeIndex].color
          ? null
          : <div>
              <hr />
              <center
                style={{backgroundColor:'black',color:'#fff',marginBottom:'10px'}}
                onClick={() => this.setState({params: {...params, activeIndex: params.activeIndex + 1}})}>+ ADD
              </center>

              <center
                style={{backgroundColor:'black',color:'#fff'}}
                onClick={() => this.submit()}>Submit
              </center>

            </div>
        }

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
      <div key={hl.x} style={{
        position:'absolute',
        width:`${hl.width}`,
        height:`${hl.height}`,
        backgroundColor:`${hl.color || 'red'}`,
        zIndex:'2',
        left: `calc((100vw - ${documentWidth}px) / 2 - 10px + ${hl.x}px)`,
        top: `${documentHeight - hl.y - hl.height + 122}px`
      }}/>
    )
  }

  submit() {
    const { x, y, width, height, color } = this.state.params.highlights[this.state.params.activeIndex];
    // console.error(this.state.params);
    if ( !!x && !!y && !!width && !!height && !!color ) {
      axios.post('/pdf', this.state.params)
      .then((response) => {
        if (response.status === 200) {
          window.alert('Success!');
        }
      });
    }
  }

  render() {
    const { file, numPages, x, y, documentHeight, documentWidth, params } = this.state;

    return (
      <div>
        <div className="Example__container__load">
          <label htmlFor="file">Load from file:</label>&nbsp;
          <input
            type="file"
            onChange={this.onFileChange}
          />
        </div>

        { this.renderParams() }

        <div onClick={this.submit.bind(this)}>submit</div>

        <div
          className="Example__container__document"
          // onMouseMove={this._onMouseMove.bind(this)}
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