const express = require('express');
const router = express.Router();
const S3O = require('s3o-middleware');

const validFiles = require('../bin/lib/valid-file');

router.get('/', S3O, function(req, res, next){

	res.render('index', {
		title : 'FT Labs Transcription Service',
		serviceName : process.env.SERVICE_NAME || 'FT Labs Transcription Service',
		shortServiceName : process.env.SERVICE_NAME || 'FT Labs Transcriptions',
		validFileTypes : `.${validFiles.getTypes.join(' or .')}`
	});

});	

module.exports = router;