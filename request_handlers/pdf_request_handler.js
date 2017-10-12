const hummus = require('hummus');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const zipFolder = require('zip-folder');

module.exports = {
  highlight: (params, cb) => {
    const pdfPath = getPdfFilePath(params.file);
    splitAndHighlightFile(pdfPath, params);

    /* for processing all .pdf file in a folder
     *
     * const filePaths = getAllPdfFilePaths();
     * filePaths.forEach(pdfPath => splitAndHighlightFile(pdfPath, params));
     */

    zipOutput(params.file.split('/')[1].replace('.pdf',''), cb);
  }
};

// Getting specific PDF file path from source folder
const getPdfFilePath = (fileName) => {
  return path.resolve(`${__dirname}/../${fileName}`);
};

// Getting all PDF file paths in a folder
const getAllPdfFilePaths = () => {
  const folder = path.resolve(`${__dirname}/../raw-pdf`);
  return fs.readdirSync(folder).reduce((pdfs, currentFileName) => {
    if (currentFileName.toLowerCase().endsWith('.pdf')) {
      pdfs.push(path.join(folder, currentFileName));
    }
    return pdfs;
  }, []);
};

const splitAndHighlightFile = (pdfFilePath, params) => {
  const outputFilePaths = split(pdfFilePath, {pageSize: params.pageSize}, params.file.split('/')[1].replace('.pdf',''));

  const defs = params.highlights;

  outputFilePaths.forEach(filePath => {
    defs.forEach(def => highlight(filePath, filePath, def));
  });
};

/******************************************************************
  Parse Setup
******************************************************************/
const ParseMask = {
  PDFLevel: 1,
  PagesCount: 1 << 1,
  Trailer: 1 << 2,
  ObjectsCount: 1 << 3,
  isEncrypted: 1 << 4,
  XrefSize: 1 << 5,
  XrefPosition: 1 << 6
};

const getInfo = (pdfReader, infoName) => {
  const methodName = infoName.startsWith('is') ? infoName : `get${infoName}`;
  return pdfReader[methodName].call(pdfReader);
};

const parse = (inputFilePath, parseMask) => {

  const pdfReader = hummus.createReader(inputFilePath);

  return Object.keys(ParseMask).reduce((result, key) => {
    if (ParseMask[key] & parseMask) {
      result[key] = getInfo(pdfReader, key);
    }
    return result;
  }, {});
};

/******************************************************************
  Split Setup
******************************************************************/

const getOutputFileCount = (inputFilePath, pageSize) => {
  const count = parse(inputFilePath, ParseMask.PagesCount).PagesCount;
  const left = count % pageSize;
  const div = (count - left) / pageSize;
  return left === 0 ? div : div + 1;
};

const getOutputFileNames = (outputFileDir, outputFileNamePrefix, outputFileCount, ext = '.pdf') => {
  return _.range(outputFileCount).map(index => `${outputFileDir}/${outputFileNamePrefix}_${index + 1}${ext}`);
};

const outputFile = (outputFilePath, inputFilePath, startIndex, endIndex) => {
  const writer = hummus.createWriter(outputFilePath);
  writer.appendPDFPagesFromPDF(inputFilePath, {
    type: hummus.eRangeTypeSpecific,
    specificRanges:[[startIndex, endIndex - 1]]
  });
  writer.end();
};

/**
 *
 * @param inputFilePath
 * @param options
 * @param [options.outputFileDir] - inputFilePath dir
 * @param [options.pageSize] = 1
 * @param [options.outputFileNamePrefix] - inputFilePath file name without extension
 */
const split = (inputFilePath, options = {pageSize: 1}, folderName) => {
  const ext = path.extname(inputFilePath);

  const outputFolder = path.resolve(`${__dirname}/../output-pdfs/${folderName}`);

  if (!fs.existsSync(outputFolder)){
    fs.mkdirSync(outputFolder);
  }

  _.defaults(options, {
    outputFileDir: outputFolder,
    outputFileNamePrefix: path.basename(inputFilePath, ext)
  });

  const outputFileCount = getOutputFileCount(inputFilePath, options.pageSize);
  const outputFilePaths = getOutputFileNames(options.outputFileDir, options.outputFileNamePrefix, outputFileCount, ext);

  outputFilePaths.forEach(
    (outputFilePath, index) => outputFile(
      outputFilePath,
      inputFilePath,
      index * options.pageSize,
      (index + 1) * options.pageSize
    )
  );

  return outputFilePaths;
};

/******************************************************************
  Highlight Setup
******************************************************************/

const defaultHighlightDef = {x: 0, y: 0, width: 100, height: 100, page: 0, color: 0xff0000};

const doHighlight = (pdfWriter, highlightDef = {}) => {
  highlightDef = Object.assign({}, defaultHighlightDef, highlightDef);
  const pageModifier = new hummus.PDFPageModifier(pdfWriter, highlightDef.page);
  const context = pageModifier.startContext().getContext();

  context.drawRectangle(highlightDef.x, highlightDef.y, highlightDef.width, highlightDef.height, {
    type: 'fill',
    colorspace: 'rgb',
    color: parseInt(highlightDef.color.replace(/^#/, ''), 16)
  });

  pageModifier.endContext().writePage();
};


/**
 *
 * @param inputFilePath
 * @param outputFilePath
 * @param [HighlightDef] highlightDefs
 * @param HighlightDef.x
 * @param HighlightDef.y
 * @param HighlightDef.width
 * @param HighlightDef.height
 * @param HighlightDef.color
 * @param HighlightDef.page
 */
const highlight = (inputFilePath, outputFilePath, highlightDefs) => {
  if (arguments.length === 2) {
    highlightDefs = arguments[2];
    outputFilePath = inputFilePath;
  }

  const modifiedFilePath = outputFilePath;
  const pdfWriter = hummus.createWriterToModify(inputFilePath, {modifiedFilePath});

  highlightDefs = highlightDefs || [];
  if (!Array.isArray(highlightDefs))  {
    highlightDefs = [highlightDefs];
  }

  // TODO: cannot highlight multiple defs, try to run highlight multiple times
  highlightDefs.forEach(highlightDef => doHighlight(pdfWriter, highlightDef));

  pdfWriter.end();
};

/******************************************************************
  Zip Setup
******************************************************************/

const zipOutput = (folderName, cb) => {
  const sourcePath = path.resolve(`${__dirname}/../output-pdfs/${folderName}`);
  const outputPath = path.resolve(`${__dirname}/../output-pdfs/${folderName}/${folderName}.zip`);
  zipFolder(sourcePath, outputPath, function(err) {
    if(err) {
      cb(err);
    } else {
      cb(null, `/output-pdfs/${folderName}/${folderName}.zip`);
    }
  });
};