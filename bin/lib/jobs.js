const cache = require('lru-cache')({
	max: 500,
	length: function (n, key) { return n * 2 + key.length },
	dispose: function (key, n) { n.close() },
	maxAge: ( (1000 * 60) * 60 ) * 6 // 6 hours 
});

function createTranscriptionJob(ID){
	
	const job = {
		ID,
		finished : false,
		transcription : undefined
	};

	cache.set(ID, JSON.stringify(job) );

}

function getTranscriptionJob(ID){

	const job = cache.get(ID) === null ? null :  JSON.parse(cache.get(ID));

	if(job === null){
		return false;
	}

	return job;

}

function checkTranscriptionJob(ID){

	const job = getTranscriptionJob(ID);

	if(!job){
		throw `Job with ID '${ID}' does not exist`;
	}

	return job.finished;

}


function completeTranscriptionJob(ID, transcription){

	const job = getTranscriptionJob(ID);
	
	if(!job){
		throw `Job with ID '${ID}' does not exist`;
	}

	job.transcription = transcription;
	job.finished = true;

	cache.set(ID, JSON.stringify(job) );	

}

module.exports = {
	create : createTranscriptionJob,
	check : checkTranscriptionJob,
	get : getTranscriptionJob,
	complete : completeTranscriptionJob
};