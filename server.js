const express = require('express');
const path = require('path');
const parser = require('body-parser');
const multer  = require('multer');

const pdf = require('./request_handlers/pdf_request_handler');

/******************************************************************
  General Setup
******************************************************************/
const app = express();
const port = process.env.PORT || 3000;


app.use(parser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use((req, res, next) => {
  console.log(`serving ${req.method} request on ${req.url}`);
  next();
});

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

/******************************************************************
  PDF Section
******************************************************************/

// configuring Multer to use files directory for storing files
// this is important because later we'll need to access file path
const storage = multer.diskStorage({
  destination: './raw-pdf',
  filename(req, file, cb) {
    cb(null, `${new Date()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// endpoint for uploading files
app.post('/file', upload.single('file'), (req, res) => {
  const file = req.file; // file passed from client
  const meta = req.body; // all other values passed from the client, like name, etc..

  res.status(200);
  res.send({ path: file.path });
});

// endpoint for editing
app.post('/edit', (req, res) => {
  pdf.highlight(req.body, (err, outputPath) => {
    if (err) console.log('err: ', err);
    else {
      res.status(200);
      res.send(outputPath);
    }
  });
});

/******************************************************************
  Start Server
******************************************************************/

app.listen(port, () => {
  console.log(`server listening on ${port}`);
});
