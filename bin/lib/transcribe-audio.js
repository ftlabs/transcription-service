const debug = require('debug')('bin:lib:transcribe-audio');
const fs = require('fs');

const projectId = process.env.GCLOUD_PROJECT;

const gcloud = require('google-cloud')({
	projectId: projectId,
	credentials: JSON.parse(process.env.GCLOUD_CREDS)
});

const speech = gcloud.speech;

const speechClient = speech({
	projectId,
	credentials: JSON.parse(process.env.GCLOUD_CREDS)
});

const wait = (time) => {return new Promise( resolve => { setTimeout(resolve, time) } ) };

function transcribeAudioFile(filePath, attempt = 0){

	return new Promise( (resolve, reject) => {

		speechClient.recognize(filePath, {
			encoding: 'LINEAR16',
			sampleRate: 16000
			}, function(err, transcript) {
				
				if(err){

					if(err.description === 'Secure read failed'){
						if(attempt < 3){

							wait(800 * (attempt + 1))
								.then(function(){
									transcribeAudioFile(filePath, attempt += 1)
										.then(transcription => {
											resolve(transcription);
										})
									;
								})
							;

						} else {
							reject(err);
						}

					} else {
						reject(err);
					}

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