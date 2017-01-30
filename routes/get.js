const debug = require('debug')('transcription:routes:check');
const express = require('express');
const router = express.Router();

const jobs = require('../bin/lib/jobs');
const generateVTT = require('../bin/lib/generate-vtt-file');

router.get('/:jobID', (req, res) => {

	const jobID = req.params.jobID;
	const job = jobs.get(jobID);
	const asVTT = req.query.output === 'vtt';

	if(job === false){
		res.status(404);
		res.json({
			status : 'error',
			message : `Could not find a job with the ID ${jobID}`
		});
	} else {
		
		if(job.finished){

			if(job.failed){
				res.status(500);
				res.json({
					status : 'error',
					message : `The job with the ID of ${jobID} failed to complete.`
				});
				return;
			}

			if(asVTT){

				generateVTT(job.transcription.transcribedChunks)
					.then(VTT => {
						res.type('text/vtt');
						res.send(VTT);
					})
					.catch(err => {
						debug(err);
						res.status(err.status || 500);
						res.json({
							status : 'error',
							message : 'An error occurred as we tried to generate a VTT file. Results return as JSON',
							data : job.transcriptions.transcribedChunks
						});
					})
				;

			} else {
				res.json(job);
			}

		} else {
			res.status(202);
			res.json(job);
		}

	}

});

module.exports = router;