const debug = require('debug')('bin:lib:valid-file');
const filetype = require('file-type');

const validFileTypes = process.env.VALID_FILE_TYPES ? process.env.VALID_FILE_TYPES.split(',') : ['mp4', 'wav', 'mp3', 'ogg', 'm4a', 'mxf', 'mov'];

function checkMediaFileIsValid(buff){

	const fileInfo = filetype(buff);

	debug(fileInfo);

	if(fileInfo !== null){

		if(validFileTypes.indexOf(fileInfo.ext) > -1){
			return { valid : true, data : fileInfo };
		} else {
			return { valid : false, data : fileInfo };			
		}

	} else {
		return { valid : false };
	}

}

module.exports = {
	check : checkMediaFileIsValid,
	getTypes : validFileTypes
};