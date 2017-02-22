const debug = require('debug')('bin:lib:receive-file');
const fs = require('fs');
const shortID = require('shortid').generate;

const checkFileType = require('./valid-file').check;
const tmpPath = process.env.TMP_PATH || '/tmp';

module.exports = function(req){

	return new Promise( (resolve, reject) => {

		let requestSize = 0;
		let fileInfo = undefined

		const chunks = [];

		req.on('data', function (data) {

			if(requestSize === 0){
				fileInfo = checkFileType(data);
				
				debug(`Valid file?`, fileInfo.valid);
				if(!fileInfo.valid){
					reject({
						status : 'err',
						reason : 'Invalid file type'
					});
				} else {
					chunks.push(data);
					requestSize += data.length;
				}

			} else {
				chunks.push(data);
			}

		});

		req.on('end', function () {
			debug(`Data requestSize: ${requestSize} bytes`);
			resolve(Buffer.concat(chunks));
		});

		req.on('error', function(e) {
			debug('err:', e.message);
			reject(e);
		});

	})

};
