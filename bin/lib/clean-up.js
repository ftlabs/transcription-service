const debug = require('debug')('bin:lib:clean-file');
const fs = require('fs');
const rimraf = require('rimraf');

const tmpPath = process.env.TMP_PATH || '/tmp';


module.exports = function(jobID){

	return new Promise( (resolve) => {

		// fs.unlink(`${tmpPath}/${jobID}`, resolve());
		rimraf(`${tmpPath}/${jobID}`, function(){
			rimraf(`${tmpPath}/__${jobID}`, resolve);
		});

	})
	.catch(err => debug(err));


}