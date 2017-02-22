const debug = require('debug')('bin:lib:absorb-file');
const fetch = require('node-fetch');
const shortID = require('shortid').generate;
const fs = require('fs');

const validFile = require('./valid-file').check;

// Default 40 megabytes
const MAX_FILE_SIZE = Number( process.env.MAX_FILE_SIZE ) || 41943040;
const tmpPath = process.env.TMP_PATH || '/tmp';

module.exports = function(url){

	return fetch(url, {method : "HEAD"})
		.then(res => {
			if(res.status !== 200){
				throw res;
			} else {

				debug("Resource Size:", res.headers.get('content-length'));
				const resourceSize = Number(res.headers.get('content-length'));

				if(resourceSize > MAX_FILE_SIZE){
					throw new Error(`Requested resource exceeds maximum allowed file size ${MAX_FILE_SIZE} bytes.`)
				} else {
					return fetch(url);
				}

			}
		})
		.then(res => {
			if(res.status !== 200){
				throw res;
			} else {
				return res;
			}
		})
		.then(res => {

			return new Promise( ( resolve, reject ) => {
				
				let firstChunk = true;
				const chunks = [];

				res.body.on('data', chunk => {

					if(firstChunk){
						firstChunk = false;
						debug(validFile(chunk));
						if(validFile(chunk).valid === false){
							res.body.end();
							reject('Not a valid file type');
							return false;
						} else {
							chunks.push(chunk);
						}
					} else {
						chunks.push(chunk);
					}

				});

				res.body.on('end', function(){
					resolve(Buffer.concat(chunks));
				});

			});

		})
		.catch(err => {
			debug(err);
			throw err;
		})
	;


};