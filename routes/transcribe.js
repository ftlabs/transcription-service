const debug = require('debug')('transcription:routes:index');
const fs = require('fs');
const express = require('express');
const router = express.Router();

const requireToken = require('../bin/lib/require-token');
const limitRequestSize = require('../bin/lib/limit-request-size');

const receiveFile = require('../bin/lib/receive-file');
const absorbFile = require('../bin/lib/absorb-file');
const jobs = require('../bin/lib/jobs');
const validateQueryParameters = require('../bin/lib/validate-query-parameters');

router.use(requireToken);
router.use(validateQueryParameters);

router.get('/',function(req, res){

	if(req.query.resource){
		absorbFile(req.query.resource)
			.then(file => jobs.create(file, req.query.languagecode))
			.then(function(jobID){
				res.json({
					status : 'ok',
					id : jobID,
					message : `Job created. Please check ${process.env.SERVICE_ORIGIN}/get/${jobID} to get status/transcription.`
				})
			})
			.catch(err => {
				debug(err);

				res.status(500);
				res.json({
					status : 'error',
					reason : err.reason || err
				});

			})
		;
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
	receiveFile(req, res)
		.then(file => jobs.create(file, req.query.languagecode))
		.then(function(jobID){
			res.json({
				status : 'ok',
				id : jobID,
				message : `Job created. Please check ${process.env.SERVICE_ORIGIN}/get/${jobID} to get status/transcription.`
			})
		})
		.catch(err => {
			debug(err);

			res.status(500);
			res.json({
				status : 'error',
				reason : err.reason || err
			});

			req.destroy();

		})
	;
});

module.exports = router;
