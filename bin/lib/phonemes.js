const debug = require('debug')('bin:lib:phonemes');
const fs = require('fs');
const phonemes = {};
const lookup = {};

debug(`${__dirname}/../cmudict-0.7b.txt`);

fs.readFileSync(`${__dirname}/../cmudict-0.7b.txt`, 'utf8').split('\n').forEach(line => {

	const parts = line.split(' ');
	const key = removePunctuation( parts.shift().toLowerCase() );
	const value = parts.join('').replace(/ /g , '').replace(/[0-9]/g, '');

	phonemes[key] = value;

	const lKey = value.toLowerCase();

	if(lookup[lKey] !== undefined){
		if(lookup[lKey].constructor !== Array){
			lookup[lKey] = [lookup[lKey]];
			lookup[lKey].push(key);			
		} else {
			lookup[lKey].push(key);
		}
	} else {
		lookup[value.toLowerCase()] = key;
	}


});

debug(lookup);
debug('Phonemes dataset loaded');

function removePunctuation(s){

	return s.replace(/[.,\/#!$%\^&\*;:'{}=\-_`~()]/g, '');

}

function convertStringToPhonemes(s){
	debug(s);
	const parts = s.split(' ');
	return parts.map(p => {
		p = removePunctuation( p.toLowerCase() );
		debug(p);
		if(phonemes[p] !== undefined){
			return phonemes[p];
		} else {
			return p;
		}
	}).join(' ');

}

function convertPhonemesToString(phonemes){

	return phonemes.split(' ').map(phoneme => {
		
		phoneme = removePunctuation( phoneme.toLowerCase() );
		debug(phoneme);
		if(lookup[phoneme] !== undefined){
			const selectedWord = lookup[phoneme].constructor === Array ? lookup[phoneme][0] : lookup[phoneme]
			debug(">>>", selectedWord, phoneme);
			return selectedWord;
		} else {
			return phoneme;
		}

	}).join(' ');

}

module.exports = {
	convert : convertStringToPhonemes,
	get : phonemes,
	reverse : convertPhonemesToString
}