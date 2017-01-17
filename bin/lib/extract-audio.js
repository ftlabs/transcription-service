const debug = require('debug')('bin:lib:extract-audio');
const spawn = require('child_process').spawn;
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');
const shortID = require('shortid').generate;
const fileInfo = require('file-type');

const tmpPath = process.env.TMP_PATH || '/tmp';

module.exports = function(sourceFilePath){

	return new Promise( (resolve, reject) => {
		debug('sourceFilePath:', sourceFilePath);

		fs.open(sourceFilePath, 'r', function(status, fd) {
			if (status) {
				reject(status.message);
			} else {
				debug(fd);
				const buffer = Buffer.from(new Uint8Array(100));

				fs.read(fd, buffer, 0, 100, 0, function(err, num, buff) {

					if(err){
						reject(err);
					} else {
						
						const fileInformation = fileInfo(buff);

						if(fileInformation !== null && fileInformation.ext === 'wav'){
							resolve(sourceFilePath);
						} else {

							const jobID = shortID();

							const outputDestination = `${tmpPath}/${jobID}.wav`;

							const args = [
								'-i',
								sourceFilePath,
								outputDestination
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
									resolve(outputDestination);
								}

							});

						}

					}

				});

			}

		});

	});


}