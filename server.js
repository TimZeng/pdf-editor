const express = require('express');
const path = require('path');
const parser = require('body-parser');


const pdf = require('./request_handlers/pdf_request_handler');
// const messager = require('./request_handlers/message_request_handler');

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

app.post('/pdf', (req, res) => {
  pdf.highlight(req.body, (err, resp) => {
    if (err) console.log('err: ', err);
    else {
      res.status(200);
      res.send('success');
    }
  });
});

/******************************************************************
  Blog Section
******************************************************************/

// app.get('/blogList', (req, res) => {
//   blogger.getBlog.getBlogList((err, blogList) => {
//     if (err) {
//       res.send(err);
//     } else {
//       res.status(200);
//       res.send(JSON.stringify(blogList));
//     }
//   });
// });

// app.get('/blog', (req, res) => {
//   blogger.getBlog.getOneBlog(req.query.blogID, (err, blog) => {
//     if (err) {
//       res.send(err);
//     } else {
//       res.status(200);
//       res.send(JSON.stringify(blog));
//     }
//   });
// });

// app.post('/blog', (req, res) => {
//   blogger.postBlog.saveBlog(req.body, () => {
//     res.status(200);
//     res.send('success');
//   });
// });

/******************************************************************
  Start Server
******************************************************************/

app.listen(port, () => {
  console.log(`server listening on ${port}`);
});
