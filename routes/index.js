const debug = require('debug')('transcription:routes:index');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const shortID = require('shortid').generate;

const checkFileType = require('../bin/lib/valid-file');
const tmpPath = process.env.TMP_PATH || '/tmp';

router.get('/', function(req, res) {
  res.end();
});

router.get('/get/:UUID', function(req, res){
  res.end();
});

// curl -i -X POST local.ft.com:3000/transribe -H "Content-Type: application/octet-stream" --data-binary "@path/to/file"
router.post('/transribe', function(req, res) {

  let requestSize = 0;
  const tmpID = shortID();
  let fileStream = undefined;

  req.on('data', function (data) {
 
        // requestChunks.push(data);

        if(requestSize === 0){
          const validFile = checkFileType(data);
          
          debug(`Valid file?`, validFile);

          if(!validFile){
            res.status(422).end();
            return;
          } else {
            fileStream = fs.createWriteStream(`${tmpPath}/${tmpID}`, { defaultEncoding : 'binary'} );
          }

        } else {
          fileStream.write(data);
        }

        requestSize += data.length;
        debug(`Got ${data.length} bytes. Total: ${requestSize}`);

    });

    req.on('end', function () {

        debug(`Data requestSize: ${requestSize} bytes`);
        res.end(`OK\n`);

        fileStream.end();
        debug(`File written to: ${tmpPath}/${tmpID}`);
    });

    req.on('error', function(e) {
        debug('err:', e.message);
        res.status(500);
        res.end();
        fileStream.end();
    });

});

module.exports = router;
