const extractAudio = require('./extract-audio');
const splitAudio = require('./split-audio');

module.exports = function (filePath, jobID, duration){

	return extractAudio(filePath, jobID)
		.then(file => {
			if(duration){
				return splitAudio.atIntervals(file, jobID, duration);
			} else {
				return splitAudio.onSilence(file, jobID);
			}
		})
	;

}
