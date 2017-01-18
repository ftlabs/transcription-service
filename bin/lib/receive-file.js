const debug = require('debug')('bin:lib:receive-file');
const fs = require('fs');
const shortID = require('shortid').generate;

const checkFileType = require('./valid-file');
const tmpPath = process.env.TMP_PATH || '/tmp';

module.exports = function(req){

	const tmpID = shortID();
	const destination = `${tmpPath}/${tmpID}`;

	return new Promise( (resolve, reject) => {

		let requestSize = 0;
		let fileStream = undefined;
		let fileInfo = undefined

		req.on('data', function (data) {

			if(requestSize === 0){
				fileInfo = checkFileType(data);
				
				debug(`Valid file?`, fileInfo.valid);
				if(!fileInfo.valid){
					reject({
						message : 'Invalid filetype'
					});
					fs.unlink(destination);
					return;
				} else {
					fileStream = fs.createWriteStream(`${destination}`);
					fileStream.setDefaultEncoding('binary');
					fileStream.write(data);
				}

			} else {
				fileStream.write(data);
			}

			requestSize += data.length;
			debug(`Got ${data.length} bytes. Total: ${requestSize}`);

		});

		req.on('end', function () {

			debug(`Data requestSize: ${requestSize} bytes`);
			fileStream.end();
			debug(`File written to: ${destination}`);
			resolve(destination);

		});

		req.on('error', function(e) {
			debug('err:', e.message);
			reject(e);
			fileStream.end();
		});

	})
	.catch(err => {
		fs.unlink(destination);
		throw err;
	});

};
