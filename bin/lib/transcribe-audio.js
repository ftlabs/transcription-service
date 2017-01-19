const debug = require('debug')('bin:lib:transcribe-audio');
const fs = require('fs');

const projectId = process.env.GCLOUD_PROJECT; // E.g. 'grape-spaceship-123' 
 
// debug(process.env.GCLOUD_CREDS));

const gcloud = require('google-cloud')({
	projectId: projectId,
	credentials: JSON.parse(process.env.GCLOUD_CREDS)
});

const speech = gcloud.speech;

const speechClient = speech({
	projectId,
	credentials: JSON.parse(process.env.GCLOUD_CREDS)
});

function transcribeAudioFile(filePath){

	return new Promise( (resolve, reject) => {

		speechClient.recognize(filePath, {
			encoding: 'LINEAR16',
			sampleRate: 16000
			}, function(err, transcript) {
				debug(err);

				if(err){
					reject(err);
				} else {
					resolve(transcript);
				}

			}
		);

	} );
	

}

module.exports = function(audioFiles){
	debug("audioFiles", audioFiles);
	return Promise.all( audioFiles.map(file => { return transcribeAudioFile(file) } ) )
		.catch(err => {
			debug(err);
			throw Error('An error occurred in the transcription process');
		})
	;


};