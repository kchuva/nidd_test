const express = require('express')
const morgan = require('morgan')
const path = require('path')
const rfs = require('rotating-file-stream')
const et = require('express-timestamp')
const fs = require('fs')

const app = express()
const port = 8080

/*var accessLogStream = rfs.createStream('request.log', {
    interval: '1d',
    path: path.join(__dirname, 'log')
})*/
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'request.log'), {
    flags: 'a'
})

morgan.token('timestamp', function getTimestamp(req) {
    return req.timestamp.format()
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
    stream: accessLogStream
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
