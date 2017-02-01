const debug = require('debug')('bin:lib:transcribe-audio');
const fs = require('fs');

const wait = require('./wait');

const projectId = process.env.GCLOUD_PROJECT;

const gcloud = require('google-cloud')({
	projectId: projectId,
	credentials: JSON.parse(process.env.GCLOUD_CREDS)
});

const Speech = gcloud.speech;

const speech = new Speech({
	projectId,
	credentials: JSON.parse(process.env.GCLOUD_CREDS)
});

function splitPhrases(phrase = "", chunkSize = 90){

	const words = phrase.split(' ');

	const chunks = [];

	let currentChunk = '';

	words.forEach(word => {

		if(`${currentChunk} `.length + word.length < chunkSize){
			currentChunk = `${currentChunk} ${word}`;
		} else {
			chunks.push(currentChunk);
			currentChunk =` ${word}`;
		}

	});

	return chunks;

}

function transcribeAudio(audioFile, phrase = '', language, attempt = 0){

	return new Promise( (resolve, reject) => {
		const phrases = splitPhrases(phrase);
		const config = {
			encoding: 'LINEAR16',
			sampleRate: 16000,
			profanityFilter : true,
			speechContext : {
				phrases
			},
			languageCode : language || 'en-GB',
			verbose: true
		};

		speech.recognize(audioFile, config, function(err, result) {
				
				if(err){

					if(attempt < 4){
						transcribeAudio(audioFile, phrase, language, attempt + 1)
							.then(result => resolve(result))
						;
					} else {
						debug(err);
						reject(err);
					}

				} else {

					if(result[0] === undefined){
						debug('Empty result:', result);
						resolve('');
					} else {
						resolve(result[0].transcript);
					}

				}

			}
		);

	} );

}

module.exports = function(audioFiles, phrase, language = 'en-GB'){

	debug("audioFiles", audioFiles);

	if(audioFiles.constructor !== Array){
		audioFiles = [audioFiles];
	}
	console.time('transcribe');
	return Promise.all( audioFiles.map(file => { return transcribeAudio(file, phrase, language) } ) )
		.then(transcriptions => {
			console.time('transcribe');
			return transcriptions;
		})
		.catch(err => {
			debug('Transcription error:', err);
			throw Error('An error occurred in the transcription process');
		})
	;

};