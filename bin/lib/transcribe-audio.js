const debug = require('debug')('bin:lib:transcribe-audio');
const fs = require('fs');

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

const wait = (time) => {return new Promise( resolve => { setTimeout(resolve, time) } ) };

function splitPhrases(phrase, chunkSize = 100, respectSpaces = true){

	const words = phrase.split(' ');

	const chunks = [];

	let currentChunk = "";

	debug(words, chunks, currentChunk);

	words.forEach(word => {

		if(`${currentChunk} `.length + word.length < chunkSize){
			currentChunk = `${currentChunk} ${word}`;
		} else {
			chunks.push(currentChunk);
			currentChunk =` ${word}`;
		}
		
		debug(words, chunks, currentChunk);

	});

	return chunks;

}

function transcribeAudio(audio, phrase = ''){

	return new Promise( (resolve, reject) => {

		debug('beginning transcribe');

		const results = [];

		let idx = 0;
		const streams = audio.map(file => {return fs.createReadStream(file, {autoClose : false})});

		const phrases = splitPhrases(phrase);

		debug("PHRASING:", phrases);

		const request = {
			config: {
				encoding: 'LINEAR16',
				sampleRate: 16000,
				profanityFilter : true,
				speechContext : {
					phrases
				}
			},
			singleUtterance: false,
			interimResults: false,
			verbose: true
		};

		function transcribeAudioStream(stream){
			debug(stream);
			const S = speech.createRecognizeStream(request);

			let u = "";

			S.on('error', function(err){
				debug('ERR', err);
				reject(err);
			});

			S.on('data', function(d){
				console.log(d);
				// u = d.results;

				if(d.results.forEach === undefined){
					u += d.results;
				} else {
					let maxConfidence = 0;
					let maxConfidencePhrase = '';

					d.results.forEach(result => {
						if(result.confidence > maxConfidence){
							maxConfidence = result.confidence;
							maxConfidencePhrase = result.transcript;
						}
					});

					u += maxConfidencePhrase;

				}

			})

			S.on('end', function(d){
				debug(`Stream ${idx} ended`, d);
				idx += 1;
				// total += " " + u;
				results.push(u)
				if(idx < streams.length){
					transcribeAudioStream(streams[idx]);
				} else {
					debug(u);
					resolve(results);
				}

			});

			stream.pipe(S);

		};

		transcribeAudioStream(streams[0]);

	});

}

module.exports = function(audioFiles, phrase){

	debug("audioFiles", audioFiles);

	if(audioFiles.constructor !== Array){
		audioFiles = [audioFiles];
	}
	
	return transcribeAudio(audioFiles, phrase);

};