const magicNumbers = new Buffer.from([0x06, 0x0E, 0x2B, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0D, 0x01, 0x02, 0x01, 0x01, 0x02]);

console.log(magicNumbers);

module.exports = function(buffer){

	let match = true;

	magicNumbers.forEach( (bit, idx) => {

		if(bit !== buffer[idx]){
			match = false;
		}

	});

	return match;

}