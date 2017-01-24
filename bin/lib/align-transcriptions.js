const debug = require('debug')('bin:lib:align-transcriptions');
const phonemes = require('./phonemes');
const levenshtein = require('levenshtein');

/*


{ transcribedChunks: 
 [ { transcription: 'when the bank of England announced',
     timeOffsets: [Object] },
   { transcription: 'sweet that Charlotte old was two bits fast cheap hope',
     timeOffsets: [Object] },
   { transcription: 'can officer I felt a little bit of pleasure',
     timeOffsets: [Object] },
   { transcription: 'pleasurable', timeOffsets: [Object] },
   { transcription: 'the woman I just been making a radio program',
     timeOffsets: [Object] },
   { transcription: 'another woman his arrival at the bank also caused the',
     timeOffsets: [Object] },
   { transcription: 'she was Janet Ho Golf',
     timeOffsets: [Object] },
   { transcription: 'shima\'s hope might have hit you too but',
     timeOffsets: [Object] },
   { transcription: 'serious blue stockings with degrees from',
     timeOffsets: [Object] },
   { transcription: '', timeOffsets: [Object] } ],
whole: [ 'when the bank of England announced last week that Charlotte told was to be its first Chief Operating Officer I felt a little bit of pleasure I\'m quite a loss of revulsion pleasure because she\'s a woman I just been making a radio program about another woman his arrival at the bank also caused the bunch of stuff she was Janet who goes and I think she has heard much of him to talk but it\'s a serious blue stockings with chalk degrees from Oxford and Harvard' ] } 

Algorithm:

offset = X

Iterate through transcription chunks.
Check for an exact match across the large transcription
	if match is found: set new offset

*/

module.exports = function(parts, whole){

	debug("PARTS:", parts);
	debug("WHOLE:", whole);

	const wholeSounds = phonemes.convert(whole);
	const partsSounds = parts.map(p => {
		return phonemes.convert(p.transcription);
	});

	const bestMatches = partsSounds.map(part => {

		let bestMatchOffset = 0;
		let bestMatch = Infinity;

		for(let idx = 0; idx < wholeSounds.length; idx += 1){

			const section = wholeSounds.slice(idx, idx + part.length);
			const distance = levenshtein(section, part);
			// debug('DISTANCE', distance);
			if( distance < bestMatch ){
				bestMatchOffset = idx;
				bestMatch = distance;
			}

		}
		debug('Best Match:', part, wholeSounds.slice(bestMatch, bestMatch + part.length), bestMatch);
		return bestMatchOffset;

	});

	const pairs = partsSounds.map( (p, idx) => {
		// debug(wholeSounds.slice(bestMatches[idx], bestMatches[idx] + p.length));
		return {
			part : p,
			match : wholeSounds.slice(bestMatches[idx], bestMatches[idx] + p.length),
			distance : bestMatches[idx]
		}
	});

	debug(wholeSounds, partsSounds);
	
	debug("PAIRS:", pairs);

	const a = pairs.map(pair => {
		debug('\n\n\n', pair.match);
		const r = phonemes.reverse(pair.match);
		return r;
	});

	debug(whole);
	debug('Reconstruct:', a);

};