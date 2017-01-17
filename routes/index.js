const debug = require('debug')('transcription:routes:index');
const express = require('express');
const router = express.Router();

const limitRequestSize = require('../bin/lib/limit-request-size');
const receiveFile = require('../bin/lib/receive-file');
const extractAudio = require('../bin/lib/extract-audio');
const splitAudio = require('../bin/lib/split-audio');

router.use(limitRequestSize);

router.get('/', function(req, res) {
  res.end();
});

// curl -i -X POST local.ft.com:3000/transribe -H "Content-Type: application/octet-stream" --data-binary "@path/to/file"
router.post('/transcribe', function(req, res) {

	/*receiveFile(req)
		.then(file => extractAudio(file))
		.then(file => splitAudio(file))
		.then(files => {
			console.log(files);
		})
	;*/

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
		})
		.catch(err => {
			debug(err);
		})
	;

	res.end();

		/*.then(fileInfo => {
			let audioToSplit = undefined;

			if(fileInfo.ext !== 'wav'){
				audioToSplit = extractAudio(fileInfo.destination, true);
			} else {
				audioToSplit = Promise.resolve(fileInfo.destination);
			}

			// splitFile(fileInfo.destination);

			audioToSplit
				.then(audioPath => splitAudio(audioPath))
				.catch(err => {
					debug(`An error occurred when trying to transcribe the audio`, err);
				})
			; 

		})
		.catch(err => {
			debug(err);
			res.status(500);
			res.json(err);
		})
	;*/

});

module.exports = router;
