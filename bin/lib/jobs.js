const debug = require('debug')('bin:lib:jobs');
const cache = require('lru-cache')({
	max: 500,
	length: function (n, key) { return n * 2 + key.length },
	maxAge: ( (1000 * 60) * 60 ) * 6 // 6 hours 
});

function createTranscriptionJob(ID){

	if(getTranscriptionJob(ID) !== false){
		throw `A job with ${ID} already exists`;
	}

	const job = {
		ID,
		finished : false,
		transcription : undefined
	};

	cache.set(ID, JSON.stringify(job) );

}

function getTranscriptionJob(ID){

	debug('GET', cache.get(ID));
	
	const job = cache.get(ID) === undefined ? undefined : JSON.parse(cache.get(ID));
	
	if(job === undefined){
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
	debug('Finished Job', job);

	cache.set(ID, JSON.stringify(job) );

}

function setJobAsFailed(ID, reason){
	
	const job = getTranscriptionJob(ID);
	
	if(!job){
		debug(`Job with ID '${ID}' does not exist`);
		return false;
	}

	job.finished = true;
	job.failed = true;
	job.reason = reason || '';
	cache.set(ID, JSON.stringify(job) );

}

module.exports = {
	create : createTranscriptionJob,
	check : checkTranscriptionJob,
	get : getTranscriptionJob,
	complete : completeTranscriptionJob,
	failed : setJobAsFailed
};