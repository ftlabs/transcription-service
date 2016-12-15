const debug = require('debug')('transcription:routes:index');
const express = require('express');
const router = express.Router();

const checkFileType = require('../bin/lib/valid-file');


router.get('/', function(req, res) {
  res.end();
});

router.get('/get/:UUID', function(req, res){
  res.end();
});

// curl -i -X POST local.ft.com:3000/transribe -H "Content-Type: application/octet-stream" --data-binary "@path/to/file"
router.post('/transribe', function(req, res) {

  let requestSize = 0;
  const requestChunks = [];
  let completeFile = undefined;

  req.on('data', function (data) {
        requestSize += data.length;
        requestChunks.push(data);
        debug(`Got ${data.length} bytes. Total: ${requestSize}`);

        if(requestChunks.length === 1){
          debug( checkFileType(requestChunks[0]) );
        }

    });

    req.on('end', function () {

        debug(`Data requestSize: ${requestSize} bytes`);
        res.end(`OK\n`);
        completeFile = Buffer.concat(requestChunks);
        debug(completeFile, completeFile.length);
        debug(requestChunks[0])
    });

    req.on('error', function(e) {
        debug('err:', e.message);
        res.status(500);
        res.end();
    });

});

module.exports = router;
