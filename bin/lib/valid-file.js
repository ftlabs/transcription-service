const filetype = require('file-type');

const validFileTypes = process.env.VALID_FILE_TYPES ? process.env.VALID_FILE_TYPES.split(',') : ['mp4', 'wav', 'mp3', 'ogg', 'm4a'];

module.exports = function(buff){

	const fileInfo = filetype(buff);
	return fileInfo !== null ? validFileTypes.indexOf( fileInfo.ext ) > -1 : false;

}