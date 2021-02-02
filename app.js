var express = require('express')
const fileUpload = require('express-fileupload');
const app = express();
let port = process.env.PORT || 5000
const cors = require('cors');
var bodyParser = require('body-parser')

app.use(cors());
app.use(fileUpload());

app.use(bodyParser.json())

//set up websocket
const ws = require('ws');
const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
  socket.on('message', function incoming(data) {
    console.log(data)
     wsServer.clients.forEach(function each(client) {
       if (client.readyState === ws.OPEN) {
         client.send(data);
       }
     });
   });
 });


var mysql = require('mysql');
var con = mysql.createConnection({
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASS,
  database: process.env.RDS_DB,
});

/* CODE FOR AWS S3 FILE UPLOAD
var AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: '',
  secretAccessKey: '',
  region: '',
})

app.post('/imageUpload', async (req, res) => {
    console.log(Date.now())

    const s3 = new AWS.S3();
    console.log(req)
    // Binary data base64
    const fileContent  = Buffer.from(req.files.prof.data, 'binary');
    const name = req.files.prof.name

    // Setting up S3 upload parameters
    const params = {
        Bucket: '',
        Key: name, // File name you want to save as in S3
        Body: fileContent,
        ACL: 'public-read'
    };

    //insert db record
    var sql = `INSERT INTO '' () VALUES ()`;
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("record inserted");
    });


    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        res.send({
            "response_code": 200,
            "response_message": "Success",
            "response_data": data
        });
    });

})
*/

app.post('/comments', async (req, res) => {
  console.log(req.body)
  var sql = `INSERT INTO Comments
  (Comment, Author, Posted, ParentUUID, CommentUUID, DocumentID, Timestamp)
  VALUES
  (
    "${mysql.escape(req.body.Comment)}",
    "${req.body.Author}",
    "${req.body.Posted}",
    "${req.body.ParentUUID ? req.body.ParentUUID : null}",
    "${req.body.CommentUUID}",
    "${req.body.DocumentID}",
    "${req.body.Timestamp}"
  )`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("record inserted");
    res.send("testing")
  });
})

app.put('/delete/:uuid', async (req, res) => {
  console.log(req.body)
  let uuid = req.params.uuid;
  var sql = `UPDATE Comments
  SET Comment = ${mysql.escape('"deleted"')}
  WHERE CommentUUID = "${uuid}" `;
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("record 'deleted'");
  });
})

app.put('/edit/:uuid', async (req, res) => {
  console.log(req.body)
  let uuid = req.params.uuid;
  var sql = `UPDATE Comments
  SET Comment = "${mysql.escape(req.body.Comment)}",
  Timestamp = "${req.body.Timestamp}"
  WHERE CommentUUID = "${uuid}" `;
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("record edited");
  });
})


app.get('/comments', (req, res) => {
  var sql = `SELECT * from Comments`
	con.query(sql, function (error, results, fields) {
    results.forEach(a => a.Comment = a.Comment.slice(1, a.Comment.length-1))
		res.send({results})
	});
});

app.get('/comments/:id', (req, res) => {
    let id = req.params.id;
    let sql = `SELECT * from Comments WHERE DocumentID = ${id}`;
    con.query(sql, function (error, results, fields) {
      results.forEach(a => a.Comment = a.Comment.slice(1, a.Comment.length-1))
      res.send({results})
    });
  })

app.post('/documents', async (req, res) => {
  console.log(req.body)
  var sql = `INSERT INTO Documents
  (DocumentFileUrl, DocumentOwnerID, DocumentName)
  VALUES
  (
    "${req.body.DocumentFileID}",
    "${req.body.DocumentOwnerID}",
    "${req.body.DocumentName}"
  )`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("document inserted");
  });
})

app.get('/documents', (req, res) => {
  var sql = `SELECT * from Documents`
	con.query(sql, function (error, results, fields) {
		res.send({results})
	});
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const server = app.listen(port, () => {
})
server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});
