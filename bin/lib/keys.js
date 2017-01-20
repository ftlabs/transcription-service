'use strict';

const debug = require('debug')('bin:lib:keys');
const uuid = require('uuid').v4;
const database = require('./database');

function checkKeyIsValid(token){

	if(token === undefined || token === ""){
		return Promise.reject("A valid token was not passed");
	}

	return database.read({
		token
	}, process.env.AWS_KEYS_TABLE)
		.then(function(result){

			debug(result);

			const response = {};

			if(result.Item === undefined){
				response.isValid = false;				
			} else {

				const item = result.Item;

				if(item.token !== undefined && item.disabled === false){
					response.isValid = true;
					response.info = item;
				} else {
					response.isValid = false;
				}

			}

			return response;

		})
	;

}

function createKey(userDetails){

	const requiredFields = process.env.REQUIRED_KEY_CREATION_FIELDS.split(',') || [];

	if(requiredFields.length === 0){
		debug('No required fields provided');
	}
	
	const entry = {
		token : uuid().replace(/-/g, ""),
		disabled : false,
		creationTime : Date.now() / 1000 | 0
	};

	let allRequirementsMet = true;
	const omittedFields = [];

	requiredFields.forEach(field => {

		if(userDetails[field] === undefined){
			allRequirementsMet = false;
			return;
		}

	});

	if(allRequirementsMet){

		Object.keys(userDetails).forEach(key => {

			if(entry[key] !== undefined){
				return Promise.reject(`You are not able to assign the "${key}" a value`);		
			} else {
				entry[key] = userDetails[key];
			}

		});

		return database.write(entry, process.env.AWS_KEYS_TABLE)
			.then(function(){
				return entry.token;
			})
			.catch(err => {
				debug(err);
			})
		;
	} else {
		return Promise.reject(`Required fields for key creation were not met: ${omittedFields.join(', ')}`);
	}

}

function disableAlreadyCreatedKey(token){

	if(token === undefined){
		return Promise.reject(`A token to revoke was not passed`);
	} else {
		return database.update(
				{ token },
				"set disabled = :r",
				{ ":r" : true },
				process.env.AWS_KEYS_TABLE
			)
			.then(result => {
				debug(result);
				return true;
			})
		;
	}

}

module.exports = {
	check : checkKeyIsValid,
	create : createKey,
	disable : disableAlreadyCreatedKey
};