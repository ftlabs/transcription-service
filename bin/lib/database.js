const debug = require('debug')('Morar:database');
const AWS   = require('aws-sdk');
AWS.config.update({region: process.env.AWS_REGION || 'us-west-2'});

const Dynamo       = new AWS.DynamoDB();                // for basic table accesses
const DynamoClient = new AWS.DynamoDB.DocumentClient(); // for metadata about a table

function describeTable(table){
	return new Promise( (resolve, reject) => {
		if(table === undefined || table === null){
			reject(`'table' argument is ${table}`);
		} else {
			Dynamo.describeTable({
				TableName : table
			}, (err, result) => {
				if(err){
					reject(err);
				} else {				
					resolve(result);
				}
			});
		}
	});
}

function writeToDatabase(item, table){

	return new Promise( (resolve, reject) => {

		if(table === undefined || table === null){
			reject(`'table' argument is ${table}`);
		} else {
			
			DynamoClient.put({
				TableName : table,
				Item : item
			}, (err, result) => {

				if(err){
					reject(err);
				} else {				
					resolve(result);
				}

			});

		}

	});

}

function readFromDatabase(item, table){
	
	return new Promise( (resolve, reject) => {

		if(table === undefined || table === null){
			reject(`'table' argument is ${table}`);
		} else {

			DynamoClient.get({
				TableName : table,
				Key : item
			}, function(err, data) {
				
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});

		}
	
	});

}

function scanDatabase(query){
	
	debug('Scanning database', query);

	const results = [];

	function scan(query){

		return new Promise( (resolve, reject) => {

			if(query.TableName === undefined || query.TableName === null){
				reject(`'TableName' argument is ${query.TableName}`);
			} else {

				DynamoClient.scan(query, function(err, data){

					if(err){
						reject(err);
					} else {
						debug(data.Items.length);
						results.push(data);
						if(data.LastEvaluatedKey !== undefined){
							query.ExclusiveStartKey = data.LastEvaluatedKey;
							return scan(query)
								.then(function(){
									resolve();
								})
							;
						} else {
							resolve();
						}

					}

				})

			}

		});

	}

	return scan(query)
		.then(function(){

			const totalItems = [];

			results.forEach(result => {
				result.Items.forEach(Item => {
					totalItems.push(Item);
				})
			});

			debug('Total number of items:', totalItems.length);

			return {
				Items : totalItems
			};

		})
	;

}

function queryItemsInDatabase(options){

	return new Promise( (resolve, reject) => {

		DynamoClient.query(options, (err, data) => {

			if(err){
				reject(err);
			} else {
				resolve(data);
			}

		});

	});

}

function updateItemInDatabase(item, updateExpression, expressionValues, table){

	return new Promise( (resolve, reject) => {

			DynamoClient.update({
				TableName : table,
				Key : item,
				UpdateExpression : updateExpression,
				ExpressionAttributeValues : expressionValues
			}, function(err, data){

				if(err){
					reject(err);
				} else {
					resolve(data);
				}

			});
	});

}

module.exports = {
	write    : writeToDatabase,
	read     : readFromDatabase,
	scan     : scanDatabase,
	query    : queryItemsInDatabase,
	update   : updateItemInDatabase,
	describe : describeTable
};