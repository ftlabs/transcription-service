const debug = require('debug')('bin:lib:receive-file');
const fs = require('fs');
const shortID = require('shortid').generate;

const checkFileType = require('./valid-file').check;
const tmpPath = process.env.TMP_PATH || '/tmp';

module.exports = function(req){

	const tmpID = shortID();
	const destination = `${tmpPath}/${tmpID}`;

	return new Promise( (resolve, reject) => {

		let requestSize = 0;
		let fileStream = undefined;
		let fileInfo = undefined

		req.on('data', function (data) {
			debug(data);
			if(requestSize === 0){
				fileInfo = checkFileType(data);
				
				debug(`Valid file?`, fileInfo.valid);
				if(!fileInfo.valid){
					// req.destroy();
					reject({
						status : 'err',
						reason : 'Invalid file'
					});
				} else {
					fileStream = fs.createWriteStream(`${destination}`);
					fileStream.setDefaultEncoding('binary');
					fileStream.write(data);
					requestSize += data.length;
				}

			} else {
				fileStream.write(data);
			}

			debug(`Got ${data.length} bytes. Total: ${requestSize}`);

		});

		req.on('end', function () {

			if(fileStream !== undefined){

				debug(`Data requestSize: ${requestSize} bytes`);
				fileStream.end();
				debug(`File written to: ${destination}`);
				resolve(destination);

			}


		});

		req.on('error', function(e) {
			debug('err:', e.message);
			reject(e);
			fileStream.end();
		});

	})

};
