const debug = require('debug')('bin:lib:job');
const fs = require('fs');

const bucket = require('./bucket-interface');
const prepareAudio = require('./prepare-audio');
const transcribeAudio = require('./transcribe-audio');
const cleanUp = require('./clean-up');
const getTimeIndexes = require('./generate-time-indexes');

const tmpPath = process.env.TMP_PATH || '/tmp';

function Job(id, language){
	this.id = id;
	this.language = language;
	this.finished = false;
	this.inProgress = false;
	this.transcription = undefined;
}

Job.prototype.start = function(){
	
	bucket.get(this.id)
		.then(data => {

			const destination = `${tmpPath}/${this.id}`;

			return new Promise( (resolve, reject) => {
					fs.writeFile(destination, data.Body, err => {
						if(err){
							reject(err);
						} else {
							resolve(`${tmpPath}/${this.id}`);
						}
					})
				})
				.catch(err => {
					debug(err);
					this.failed = true;
				})
			;

		})
		.then(filePath => {
			prepareAudio(filePath, this.id, process.env.AUDIO_MAX_DURATION_TIME || 55)
				// Get a transcription of the whole audio to serve as a guide for the chunks
				.then(audio => transcribeAudio(audio, undefined, this.language))
				.then(transcriptions => {
					debug('Whole transcriptions:', transcriptions);

					if(transcriptions.length > 1){
						transcriptions = transcriptions.join(' ');
					} else {
						transcriptions = transcriptions[0];
					}

					// Split the audio file into 3 second chunks for time-based transcriptions
					return prepareAudio(filePath, this.id)
						.then(files => {
							// Get the time indexes + offsets for each audio chunk
							return getTimeIndexes(files)
								.then(durations => {
									return {
										files,
										durations
									};
								})
							;

						})
						.then(data => {
							// Transcribe all of the smaller audio chunks
							return transcribeAudio(data.files, transcriptions, this.language)
								.then(transcriptions => {
									// Link up the small audio transcriptions with the 
									// time indexes of each file
									return transcriptions.map( (t, idx) => {
										return {
											transcription : t,
											timeOffsets : data.durations[idx]
										};
									});
								})
								.then(transcribedChunks => { 
									return {
										whole : transcriptions,
										transcribedChunks
									};
								})
							;
						})
					;

				})
				.then(transcriptions => {

					this.transcription = transcriptions;
					this.finished = true;
					cleanUp(this.id);

				})
			;

		})
		.catch(err => {
			debug(err);
			cleanUp(this.id);
			this.failed = true;
		})
	;

};

module.exports = Job;