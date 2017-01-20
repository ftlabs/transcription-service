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
const generateVTT = require('../bin/lib/generate-vtt-file');

function prepareAudio(filePath, jobID){

	return extractAudio(filePath, jobID)
		.then(file => splitAudio(file, jobID))
	;

}

function generateTranscriptions(audioFile, req, res){

	const jobID = shortID();

	return prepareAudio(audioFile, jobID)
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

			if(req.query.output === undefined){
				res.json(transcriptions);
			} else if(req.query.output === "vtt"){
				generateVTT(transcriptions)
					.then(VTT => {
						res.type('text/vtt');
						res.send(VTT);
					})
					.catch(err => {
						res.status(err.status || 500);
						res.json({
							status : 'error',
							message : err.message || 'An error occurred as we tried to generate a VTT file. Results return as JSON',
							data : transcriptions
						});
					})
				;
			} else {
				res.json(transcriptions);				
			}
			
			cleanUp(jobID);
		})
	;
}

router.get('/', function(req, res) {
  res.end();
});

router.get('/transcribe', function(req, res){

	if(req.query.resource){
		absorbFile(req.query.resource).then(file => generateTranscriptions(file, req, res));
	} else {
		res.status(422);
		res.json({
			status : `error`,
			message : `You must pass a URL with the 'resource' query parameter pointing to the media file you wish to have transcribed.`
		});
	}

});

router.use(limitRequestSize);
router.post('/transcribe', function(req, res) {

	debug(req.body);
	receiveFile(req).then(file => generateTranscriptions(file, req, res));

});


module.exports = router;
