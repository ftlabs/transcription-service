const debug = require('debug')('transcription:routes:index');
const express = require('express');
const router = express.Router();

const limitRequestSize = require('../bin/lib/limit-request-size');
const receiveFile = require('../bin/lib/receive-file');
const absorbFile = require('../bin/lib/absorb-file');
const extractAudio = require('../bin/lib/extract-audio');
const splitAudio = require('../bin/lib/split-audio');
const transcribeAudio = require('../bin/lib/transcribe-audio');

function prepareAudio(filePath){

	return extractAudio(filePath)
		.then(file => splitAudio(file))
	;

}

router.use(limitRequestSize);

router.get('/', function(req, res) {
  res.end();
});

router.get('/transcribe', function(req, res){

	if(req.query.resource){

		absorbFile(req.query.resource)
			.then(file => prepareAudio(file))
			.then(files => transcribeAudio(files))
			.then(transcriptions => {
				debug(transcriptions);
				res.json(transcriptions);
			})
			.catch(err => {
				debug(err);
				res.status(err.status || 500);
				res.json({
					status : 'error',
					message : err.message || 'An error occurred as we tried to transcribe your file'
				});
			});
		;

	} else {

		res.status(422);
		res.json({
			status : `error`,
			message : `You must pass a URL with the 'resource' query parameter pointing to the media file you wish to have transcribed.`
		});
	
	}

});

router.post('/transcribe', function(req, res, next) {

	debug(req.body);

	receiveFile(req)
		.then(file => prepareAudio(file))
		.then(files => transcribeAudio(files))
		.then(transcriptions => {
			debug(transcriptions);
			res.json(transcriptions);
		})
		.catch(err => {
			debug(err);
			res.status(err.status || 500);
			res.json({
				status : 'error',
				message : err.message || 'An error occurred as we tried to transcribe your file'
			});
		})
	;

	// res.end();

});


module.exports = router;
