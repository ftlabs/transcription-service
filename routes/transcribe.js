const debug = require('debug')('transcription:routes:index');
const express = require('express');
const router = express.Router();
const shortID = require('shortid').generate;

const requireToken = require('../bin/lib/require-token');
const limitRequestSize = require('../bin/lib/limit-request-size');

const receiveFile = require('../bin/lib/receive-file');
const absorbFile = require('../bin/lib/absorb-file');
const extractAudio = require('../bin/lib/extract-audio');
const splitAudio = require('../bin/lib/split-audio');
const transcribeAudio = require('../bin/lib/transcribe-audio');
const cleanUp = require('../bin/lib/clean-up');
const getTimeIndexes = require('../bin/lib/generate-time-indexes');
const jobs = require('../bin/lib/jobs');

function prepareAudio(filePath, jobID, duration){

	return extractAudio(filePath, jobID)
		.then(file => splitAudio(file, jobID, duration))
	;

}

function generateTranscriptions(audioFile, req, res){

	const jobID = shortID();
	
	jobs.create(jobID);

	res.json({
		status : 'ok',
		message : `Job created. Please check http://localhost:3000/get/${jobID} to get status/transcription.`
	})

	// Convert the audio to .wav format
	prepareAudio(audioFile, jobID, 55) 
		// Get a transcription of the whole audio to serve as a guide for the chunks
		.then(audio => transcribeAudio(audio))
		.then(transcriptions => {
			debug('Whole transcriptions:', transcriptions);

			if(transcriptions.length > 1){
				transcriptions = transcriptions.join(' ');
			} else {
				transcriptions = transcriptions[0];
			}

			// Split the audio file into 3 second chunks for time-based transcriptions
			return prepareAudio(audioFile, jobID)
				.then(files => {
					// Get the time indexes + offsets for each audio chunk
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
					// Transcribe all of the smaller audio chunks
					return transcribeAudio(data.files, transcriptions)
						.then(transcriptions => {
							// Link up the small audio transcriptions with the 
							// time indexes of each file
							return transcriptions.map( (t, idx) => {
								return {
									transcription : t,
									timeOffsets : data.durations[idx]
								};
							});
						})
						.then(transcribedChunks => { 
							return {
								whole : transcriptions,
								transcribedChunks
							};
						})
					;
				})
			;

		})
		.then(transcriptions => {

			jobs.complete(jobID, transcriptions);
			cleanUp(jobID);
			
		})
		.catch(err => {
			debug(err);
			cleanUp(jobID);
			jobs.failed(jobID);
		})
	;
	
}

router.use(requireToken);

router.get('/',function(req, res){

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
router.post('/', function(req, res) {
	debug(req.body);
	receiveFile(req).then(file => generateTranscriptions(file, req, res));
});

module.exports = router;
