const debug = require('debug')('transcription:routes:index');
const express = require('express');
const router = express.Router();
const shortID = require('shortid').generate;

const limitRequestSize = require('../bin/lib/limit-request-size');
const receiveFile = require('../bin/lib/receive-file');
const absorbFile = require('../bin/lib/absorb-file');
const extractAudio = require('../bin/lib/extract-audio');
const splitAudio = require('../bin/lib/split-audio');
const transcribeAudio = require('../bin/lib/transcribe-audio');
const cleanUp = require('../bin/lib/clean-up');
const getTimeIndexes = require('../bin/lib/generate-time-indexes');

function prepareAudio(filePath, jobID){

	return extractAudio(filePath, jobID)
		.then(file => splitAudio(file, jobID))
	;

}

router.use(limitRequestSize);

router.get('/', function(req, res) {
  res.end();
});

router.get('/transcribe', function(req, res){

	if(req.query.resource){

		const jobID = shortID();
		
		absorbFile(req.query.resource)
			.then(file => prepareAudio(file))
			.then(files => transcribeAudio(files))
			.then(transcriptions => {
				debug(transcriptions);
				res.json(transcriptions);
				cleanUp(jobID);
			})
			.catch(err => {
				debug(err);
				res.status(err.status || 500);
				res.json({
					status : 'error',
					message : err.message || 'An error occurred as we tried to transcribe your file'
				});
				cleanUp(jobID);
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

router.post('/transcribe', function(req, res) {

	debug(req.body);

	const jobID = shortID();

	receiveFile(req)
		.then(file => prepareAudio(file, jobID))
		.then(files => {
			return getTimeIndexes(files)
				.then(durations => {
					return {
						files,
						durations
					};
				})
			;

		})
		.then(data => {
			return transcribeAudio(data.files, jobID)
				.then(transcriptions => {
					return transcriptions.map( (t, idx) => {
						return {
							transcription : t,
							timeOffsets : data.durations[idx]
						};
					});
				})
			;
		})
		.then(transcriptions => {
			debug(transcriptions);
			res.json(transcriptions);
			cleanUp(jobID);
		})
		.catch(err => {
			debug(err);
			res.status(err.status || 500);
			res.json({
				status : 'error',
				message : err.message || 'An error occurred as we tried to transcribe your file'
			});
			cleanUp(jobID);
		})
	;

});


module.exports = router;
