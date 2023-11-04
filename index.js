const express = require('express')
const morgan = require('morgan')
const path = require('path')
const rfs = require('rotating-file-stream')
const et = require('express-timestamp')
const fs = require('fs')
//const { S3StreamLogger } = require('s3-streamlogger');
const AWS = require("aws-sdk");
const s3 = new AWS.S3()

/*
const s3stream = new S3StreamLogger({
     bucket: "cyclic-fantastic-yak-handbag-eu-north-1",
     folder: "logs",
     buffer_size: 1024,
     upload_every: 5000,
     rotate_every: 86400000,
});
*/
const app = express()
const port = 8080
var log_buffer = ""

class MyS3Stream extends Writable {
    write(line) {
        // Here you send the log line to wherever you need
        console.log("Logger:: ", line)
         log_buffer += '\r\n' + line;
        s3.putObject({
            Body: log_buffer,
            Bucket: "cyclic-fantastic-yak-handbag-eu-north-1",
            Key: "logs/my_file.csv",
        }).promise()
    }
}
var s3stream = new MyStream();

/*var accessLogStream = rfs.createStream('request.log', {
    interval: '1d',
    path: path.join(__dirname, 'log')
})*/
/*var accessLogStream = fs.createWriteStream(path.join(__dirname, 'request.log'), {
    flags: 'a'
})*/

morgan.token('timestamp', function getTimestamp(req) {
    return req.timestamp.format('YYYY-MM-DD HH:mm:ss:SSS')
})
morgan.token('nbiot-id', function getNbiotId(req) {
    return req.body.externalId
})
morgan.token('nbiot-data', function getNbiotData(req) {
    return req.body.data
})
morgan.token('nbiot-decoded', function getNbiotDecoded(req) {
    const buffer = Buffer.from(req.body.data,'base64');
    const decodedData = buffer.toString('hex');
    return decodedData
})

function customFormat(tokens, req, res) {
    return [
        tokens['timestamp'](req),
        tokens['nbiot-id'](req),
        tokens['nbiot-data'](req),
        tokens['nbiot-decoded'](req)
    ].join(';')
}

app.use(et.init)
app.use('/', express.json());
/*app.post('/', morgan(':timestamp :nbiot-id :nbiot-data :nbiot-decoded', {
    stream: accessLogStream
}))*/
app.post('/', morgan(customFormat, {
    stream: s3stream
}))
app.post('/', (req, res) => {
    //const buffer = Buffer.from(req.body.data,'base64');
    //const decodedData = buffer.toString('hex');
    //var dt = req.timestamp;
    //console.log(`${dt.format()};${req.body['externalId']};${req.body['data']};${decodedData}`);
    res.status(200).end();
})

app.listen(port, () => {
    console.log(`HTTP server listen on port ${port}`)
})
