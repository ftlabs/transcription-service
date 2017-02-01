const debug = require('debug')('bin:lib:split-file');
const spawn = require('child_process').spawn;
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');
const shortID = require('shortid').generate;

const getTimeIndexes = require('./generate-time-indexes');

const tmpPath = process.env.TMP_PATH || '/tmp';
const maxClipSize = process.env.MAX_CLIP_SIZE || 20;

function zeroPad(num){
	if(num < 10){
		return `00${num}`;
	} else if(num < 100){
		return `0${num}`;
	} else {
		return num;
	}
}

function runFFmpeg(args){

	debug('\n\n', args.join(' '), '\n\n');

	return new Promise( (resolve, reject) => {

		let output = '';
		const process = spawn(ffmpeg.path, args);

		process.stdout.on('data', (data) => {
			debug(`stdout: ${data}`);
		});

		process.stderr.on('data', (data) => {
			// debug(`stderr: ${data}`);
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
	debug('identifyPauses');
	// ffmpeg -i /Users/sean.tracey/Downloads/1214e988-b6d7-11e6-ba85-95d1533d9a62.mp3  -af silencedetect=n=-40dB:d=0.2 -f null -
	const args = [
		'-i',
		sourceFilePath,
		'-af',
		'silencedetect=n=-40dB:d=0.2',
		'-f',
		'null',
		'-'
	];
	return runFFmpeg(args)
		.then(output => {

			debug(output.split('\n'));

			const silences = output.split('\n').filter(line => { 
					return line.indexOf('[silencedetect @') > -1 && line.indexOf('silence_end') > -1;
				})
				.map(d => {
					return d.slice( d.indexOf('silence_end') )
				})
				.map(d => {
					const halves = d.split(' | ').map( half => { return Number( half.replace( /([A-Za-z\-\_:\ ]+)/ , '') ) } );
					return {
						start : halves[0] - halves[1],
						duration : halves[1],
						end : halves[0],
						middle : halves[0] - ( ( halves[0] - halves[1] ) / 2)
					};
				})
			;

			debug(silences);
			return silences;

		})
		.catch(err => {
			debug('identifyPauses failed', err);
		})
	;

}

function divideLongClips(clips){

	const adjustedClips = [{
		start : 0,
		duration : 0
	}];

	clips.forEach( clip => {

		if(clip.duration > maxClipSize){

			const newClipSize = 4;
			const numNewClips = Math.ceil(clip.duration / newClipSize);
			
			for(let x = 0; x < numNewClips; x += 1){

				const lastClip = adjustedClips[ adjustedClips.length - 1 ];
				let newClip;
				if(x < numNewClips - 1){
					newClip = {
						start : lastClip.start + lastClip.duration,
						duration : newClipSize 
					};
				} else {
					newClip = {
						start : lastClip.start + lastClip.duration,
						duration : (clip.start + clip.duration) - (lastClip.start + lastClip.duration)
					};
				}

				adjustedClips.push(newClip);

			}

		} else {
			adjustedClips.push(clip);
		}

	});

	adjustedClips.shift();

	return adjustedClips;

}

function getClips(pauses, totalClipDuration){
	debug('getClips');
	const clips = [];
	let lastPause = 0;

	for(let z = 0; z < pauses.length - 1; z += 1){
		
		clips.push({
			start : lastPause,
			duration : pauses[z + 1].end - lastPause
		});

		lastPause = pauses[z + 1].end;

	}

	clips.push({
		start : lastPause,
		duration : totalClipDuration - lastPause
	});

	debug(clips);
	debug('totalClipDuration:', totalClipDuration);
	return clips;

}

function getListOfSplitFiles(directory){

	return new Promise( (resolve, reject) => {
		debug(directory)
		fs.readdir(directory, (err, files) => {
			if(err){
				reject(err);
			} else {
				resolve(files.map(f => {return `${directory}/${f}`;}));
			}
		});

	} );

}

function splitFileAtSpecificIntervals(sourceFilePath, jobID, duration = 3){
	debug('splitFileAtSpecificIntervals');
	return new Promise( (resolve, reject) => {
		
		const splitFilesDestination = `${tmpPath}/__${jobID}`;
		
		fs.mkdir(splitFilesDestination, function(err){

			if(err){
				reject(err);
			} else {

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

				runFFmpeg(args)
					.then(function(){
						getListOfSplitFiles(splitFilesDestination)
							.then(files => resolve(files));
						;
					})
					.catch(err => {
						debug(`An error occurred splitting the audio`);
						reject(err);
					})
				;

			}

		});
	} );

}

function splitFileOnInstancesOfSilence(sourceFilePath, jobID){

	debug('splitFileOnInstancesOfSilence');
	return new Promise( (resolve, reject) => {
		const splitFilesDestination = `${tmpPath}/_${jobID}`;

		fs.mkdir(splitFilesDestination, function(err){

			if(err){
				reject(err);
			} else {
				
				getTimeIndexes([sourceFilePath])
					.then(clipInfo => {

						return identifyPauses(sourceFilePath)
							.then(pauses => getClips(pauses, clipInfo[0].duration))
							.then(clips => divideLongClips(clips))
							.then(clips => {
								debug(clips)
								return Promise.all( clips.map( (clip, idx) => {

									const args = [
										'-ss',
										clip.start,
										'-t',
										clip.duration,
										'-i',
										sourceFilePath,
										`${splitFilesDestination}/out${ zeroPad(idx) }.wav`
									];

									return runFFmpeg(args);

								} ) );

							})
							.then(function(){
								getListOfSplitFiles(splitFilesDestination)
									.then(files => resolve(files));
								;
							})

						;

					})
					.catch(err => {
						debug(`An error occurred splitting the audio`);
						reject(err);
					})
				;

			}

		});

	} )

}

module.exports = {
	atIntervals : splitFileAtSpecificIntervals,
	onSilence : splitFileOnInstancesOfSilence
};
