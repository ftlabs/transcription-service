const debug = require('debug')('bin:lib:clean-file');
const fs = require('fs');
const rimraf = require('rimraf');

const bucket = require('./bucket-interface');

const tmpPath = process.env.TMP_PATH || '/tmp';


module.exports = function(jobID){

	return new Promise( (resolve) => {

		rimraf(`${tmpPath}/${jobID}`, function(){
			rimraf(`${tmpPath}/_${jobID}`, function(){
				rimraf(`${tmpPath}/__${jobID}`, resolve);
			});
		});

		bucket.delete(jobID)
			.catch(err => {
				debug(err);
			})
		;

	})
	.catch(err => debug(err));

}