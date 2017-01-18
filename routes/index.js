const debug = require('debug')('transcription:routes:index');
const express = require('express');
const router = express.Router();

const limitRequestSize = require('../bin/lib/limit-request-size');
const receiveFile = require('../bin/lib/receive-file');
const extractAudio = require('../bin/lib/extract-audio');
const splitAudio = require('../bin/lib/split-audio');
const transcribeAudio = require('../bin/lib/transcribe-audio');

router.use(limitRequestSize);

router.get('/', function(req, res) {
  res.end();
});

// curl -i -X POST local.ft.com:3000/transribe -H "Content-Type: application/octet-stream" --data-binary "@path/to/file"
router.post('/transcribe', function(req, res) {

	receiveFile(req)
		.then(file => {
			debug("Retrieved file:", file);
			return extractAudio(file)
		})
		.then(file => {
			debug("Extracted Audio:", file);
			return splitAudio(file)
		})
		.then(files => {
			debug("Split Audio:", files);
			return transcribeAudio(files);
		})
		.then(transcriptions => {
			debug(transcriptions);
		})
		.catch(err => {
			debug(err);
		})
	;

	res.end();

});

module.exports = router;
