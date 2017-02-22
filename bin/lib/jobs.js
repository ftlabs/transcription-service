const debug = require('debug')('bin:lib:jobs');
const os = require('os');
const fs = require('fs');
const shortID = require('shortid').generate;

const bucket = require('./bucket-interface');

const Job = require('./job');

const tmpPath = process.env.TMP_PATH || '/tmp';

const maximumConcurrentJobs = process.env.MAX_JOBS_RUNNING || os.cpus().length || 5;
const jobsQueue = [];
const jobsInProgress = [];
const activeJobs = {};

function newTranscriptionJob(ID, language){

	if(getTranscriptionJob(ID) !== false){
		throw `A job with ${ID} already exists`;
	} else {
		debug(`Creating job ${ID}`);
	}

	const job = new Job(ID, language);

	activeJobs[ID] = job;
	jobsQueue.push(job);

}

function createTranscriptionJob(file, language){

	const jobID = shortID();

	if(jobsQueue.length < maximumConcurrentJobs){

		debug('Possible to start job immediately. Writing file to system...');
		return new Promise( (resolve, reject) => {

			const destination = `${tmpPath}/${jobID}`;
			fs.writeFile(destination, file, (err) => {

				if(err){
					reject(err);
				} else {
					newTranscriptionJob(jobID, language);
					resolve(jobID);
				}

			});

		} );

	} else {
		debug('Job has to wait to begin, uploading file to S3 bucket...');
		return bucket.put(jobID, file)
			.then(function(){
				newTranscriptionJob(jobID);
				return jobID;
			})
		;

	}

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

function numberOfJobsInProgress(){
	return jobsInProgress.length;
}

function getMaximumNumberOfConcurrentJobs(){
	return maximumConcurrentJobs;
}

setInterval(checkJobs, 1000);
setInterval(workThroughQueue, 5000);

module.exports = {
	create : createTranscriptionJob,
	check : checkTranscriptionJob,
	get : getTranscriptionJob,
	number : numberOfJobsInProgress,
	max : getMaximumNumberOfConcurrentJobs
};