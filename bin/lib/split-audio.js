const debug = require('debug')('bin:lib:split-file');
const spawn = require('child_process').spawn;
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');
const shortID = require('shortid').generate;

const tmpPath = process.env.TMP_PATH || '/tmp';

// ffmpeg -i somefile.mp3 -f segment -segment_time 3 -c copy out%03d.mp3
module.exports = function(sourceFilePath, jobID){

	return new Promise( (resolve, reject) => {

		// const jobID = shortID();
		const splitFilesDestination = `${tmpPath}/__${jobID}`;

		fs.mkdir(splitFilesDestination, function(err){

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
				`${splitFilesDestination}/out%03d.wav`
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
					reject();
				} else if(code === 0){
					debug('FFMPEG closed and was happy');
					fs.readdir(splitFilesDestination, (err, files) => {
						if(err){
							reject(err);
						} else {
							resolve(files.map(f => {return `${splitFilesDestination}/${f}`;}));
						}
					})
				}

			});

		});

	});



};