const validLanguageCodes = require('./valid-language-codes');

module.exports = function(req, res, next){

	if(req.query.languagecode){
		if(!validLanguageCodes.check(req.query.languagecode)){
			res.status(422);
			res.json({
				status : 'error',
				reason : `Invalid language code '${req.query.languagecode}'. Either correct the languagecode parameter, or remove it to have media transcribed with en-GB (British English)`
			});
		} else {
			next();
		}
	} else {
		next();
	}

}