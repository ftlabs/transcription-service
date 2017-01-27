// 40 Megabytes
const debug = require('debug')('bin:lib:limit-request-size');
const MAX_FILE_SIZE = Number( process.env.MAX_FILE_SIZE ) || 41943040;

module.exports = function(req, res, next){

	if( Number(req.headers['content-length']) > MAX_FILE_SIZE ){
		res.status(422);
		res.json({
			status : 'error',
			reason : `The file was too big for upload. The maximum allowed upload size is ${MAX_FILE_SIZE} bytes.`
		});
		return;
	}

	next();

}