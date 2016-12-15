const debug = require('debug')('bin:lib:split-file');
const spawn = require('child_process').spawn;
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');
const shortID = require('shortid').generate;

const tmpPath = process.env.TMP_PATH || '/tmp';

// ffmpeg -i somefile.mp3 -f segment -segment_time 3 -c copy out%03d.mp3
module.exports = function(sourceFilePath){

	const jobID = shortID();

	fs.mkdir(`${tmpPath}/${jobID}/`, function(err){

		debug(err);

		const args = [
			'-i',
			sourceFilePath,
			'-f',
			'segment',
			'-segment_time',
			'3',
			'-c',
			'copy',
			`${tmpPath}/${jobID}/out%03d.wav`
		];
		debug(`Splitting files in ${tmpPath}/${jobID}/`);
		const process = spawn(ffmpeg.path, args);
		
		process.stdout.on('data', (data) => {
			debug(`stdout: ${data}`);
		});

		process.stderr.on('data', (data) => {
			debug(`stderr: ${data}`);
		});

		process.on('close', (code) => {

			if(code === 1){
				debug(`FFMPEG exited with status code 1 while converting ${sourceFilePath} to OGG`);
			} else if(code === 0){
				debug('FFMPEG closed and was happy');
			}

		});

	});


};