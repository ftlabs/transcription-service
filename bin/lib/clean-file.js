const debug = require('debug')('bin:lib:clean-file');
const fs = require('fs');

module.exports = function(path){

	return new Promise( (resolve) => {

		fs.unlink(path, resolve());

	})
	.catch(err => debug(err));


}