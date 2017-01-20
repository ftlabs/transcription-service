const debug = require('debug')('./generate-time-indexes');
const ffprobe = require('node-ffprobe');
process.env.FFPROBE_PATH = require('ffprobe-static').path;

module.exports = function(audioFiles){

	return new Promise( (resolve, reject) => {

		let totalDuration = 0;
	
		Promise.all(audioFiles.map(file => {
			
			return new Promise( (resolve, reject) => {
				ffprobe(file, function(err, data){
					if(err){
						reject(err);
					} else {
						resolve(data.streams[0].duration);
					}
				})
			} );
		
		}))
		.then(durations => {
			debug(durations);

			const indexes = durations.map(d => {
				const info = {
					start : totalDuration,
					end  : totalDuration + d,
					duration : d
				};

				totalDuration += d;

				return info;

			})
			debug(indexes);
			resolve(indexes);
		})
		.catch(err => {
			debug(err);
			reject(err);
		});

	});

};