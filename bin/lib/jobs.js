const debug = require('debug')('bin:lib:jobs');

const Job = require('./Job');

const maximumConcurrentJobs = process.env.MAX_JOBS_RUNNING || 5;
const jobsQueue = [];
const jobsInProgress = [];
const activeJobs = {};

function createTranscriptionJob(ID, language){

	if(getTranscriptionJob(ID) !== false){
		throw `A job with ${ID} already exists`;
	}

	const job = new Job(ID, language);

	jobsQueue.push(job);
	activeJobs[ID] = job;

}

function getTranscriptionJob(ID){

	debug('GET', activeJobs[ID]);
	
	const job = activeJobs[ID] === undefined ? undefined : activeJobs[ID];
	
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

function workThroughQueue(){

	while(jobsInProgress.length < maximumConcurrentJobs && jobsQueue.length > 0){
		const jobToStart = jobsQueue.shift();
		jobToStart.start();
		jobsInProgress.push(jobToStart);
	}

}

function checkJobs(){

	jobsInProgress.forEach( (job, idx) => {

		if(job.finished){
			jobsInProgress.splice(idx, 1);
		}

	});

}

setInterval(checkJobs, 1000);
setInterval(workThroughQueue, 5000);

module.exports = {
	create : createTranscriptionJob,
	check : checkTranscriptionJob,
	get : getTranscriptionJob
};