const debug = require('debug')('bin:lib:split-file');
const spawn = require('child_process').spawn;
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');
const shortID = require('shortid').generate;

const tmpPath = process.env.TMP_PATH || '/tmp';

function runFFmpeg(args){

	return new Promise( (resolve, reject) => {

		let output = '';
		const process = spawn(ffmpeg.path, args);

		process.stdout.on('data', (data) => {
			if(process.env.VERBOSE_FFMPEG){
				debug(`stdout: ${data}`);
			}
			output += data + '\n';
		});

		process.stderr.on('data', (data) => {
			debug(`stderr: ${data}`);
		});

		process.on('close', (code) => {

			if(code === 1){
				debug(`FFMPEG exited with status code 1 while converting ${sourceFilePath} to OGG`);
				reject();
			} else if(code === 0){
				debug('FFMPEG closed and was happy');
				resolve(output);
			}

		});

	});


}

// ffmpeg -i somefile.mp3 -f segment -segment_time 3 -c copy out%03d.mp3
module.exports = function(sourceFilePath, jobID, duration = 3){

	return new Promise( (resolve, reject) => {

		// const jobID = shortID();
		const splitFilesDestination = `${tmpPath}/__${jobID}`;

		fs.mkdir(splitFilesDestination, function(err){

			debug(err);
			
			//ffmpeg -i /Users/sean.tracey/Downloads/1214e988-b6d7-11e6-ba85-95d1533d9a62.mp3  -af silencedetect=n=-40dB:d=0.2 -f null -
			const args = [
				'-i',
				sourceFilePath,
				'-f',
				'segment',
				'-segment_time',
				duration,
				'-c',
				'copy',
				`${splitFilesDestination}/out%03d.wav`
			];
			debug(`Splitting files in ${tmpPath}/${jobID}/`);
			
			runFFmpeg(args)
				.then(function(){
					fs.readdir(splitFilesDestination, (err, files) => {
						if(err){
							reject(err);
						} else {
							resolve(files.map(f => {return `${splitFilesDestination}/${f}`;}));
						}
					});
				})
				.catch(err => {
					debug(`An error occurred splitting the audio`);
					reject(err);
				})
			;

		});

	});



};