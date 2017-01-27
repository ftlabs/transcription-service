const debug = require('debug')('bin:lib:split-file');
const spawn = require('child_process').spawn;
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');
const shortID = require('shortid').generate;

const tmpPath = process.env.TMP_PATH || '/tmp';

function runFFmpeg(args){

	debug('\n\n', args.join(' '), '\n\n');

	return new Promise( (resolve, reject) => {

		let output = '';
		const process = spawn(ffmpeg.path, args);

		process.stdout.on('data', (data) => {
			debug(`stdout: ${data}`);
		});

		process.stderr.on('data', (data) => {
			debug(`stderr: ${data}`);
			output += data + '\n';			
		});

		process.on('close', (code) => {

			if(code === 1){
				debug(`FFMPEG exited with status code 1`);
				reject();
			} else if(code === 0){
				debug('FFMPEG closed and was happy');
				resolve(output);
			}

		});

	});


}


function identifyPauses(sourceFilePath){

	// ffmpeg -i /Users/sean.tracey/Downloads/1214e988-b6d7-11e6-ba85-95d1533d9a62.mp3  -af silencedetect=n=-40dB:d=0.2 -f null -
	const args = [
		'-i',
		sourceFilePath,
		'-af',
		'silencedetect=n=-40dB:d=0.2',
		'-f',
		'null',
		' -'
	];
	return runFFmpeg(args)
		.then(output => {
			const silences = output.split('\n').filter(line => { 
					return line.indexOf('[silencedetect @') > -1 && line.indexOf('silence_end') > -1;
				})
				.map(d => {
					return d.slice( d.indexOf('silence_end') )
				})
				.map(d => {
					const halves = d.split(' | ').map( half => { return Number( half.replace( /([A-Za-z\-\_:\ ]+)/ , '') ) } );
					/* start : halves[0] - halves[1]; duration : halves[1]; end : halves[0]*/
					// Return the middle of the pause
					return halves[0] - (halves[1] / 2);
				})
			;

			debug(silences);

		})
		.catch(err => {
			debug('identifyPauses failed', err);
		})
	;

}

// ffmpeg -i somefile.mp3 -f segment -segment_time 3 -c copy out%03d.mp3
module.exports = function(sourceFilePath, jobID, duration = 3){

	identifyPauses(sourceFilePath);

	return new Promise( (resolve, reject) => {

		// const jobID = shortID();
		const splitFilesDestination = `${tmpPath}/__${jobID}`;

		fs.mkdir(splitFilesDestination, function(err){

			debug(err);
			
			//ffmpeg -i [INPUT] -af silencedetect=n=-40dB:d=0.2 -f null -
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