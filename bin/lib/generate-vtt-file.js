/*
A WebVTT timestamp consists of the following components, in the given order:

Optionally (required if hours is non-zero):
Two or more ASCII digits, representing the hours as a base ten integer.
A U+003A COLON character (:)
Two ASCII digits, representing the minutes as a base ten integer in the range 0 ≤ minutes ≤ 59.
A U+003A COLON character (:)
Two ASCII digits, representing the seconds as a base ten integer in the range 0 ≤ seconds ≤ 59.
A U+002E FULL STOP character (.).
Three ASCII digits, representing the thousandths of a second seconds-frac as a base ten integer.
*/

function convertSecondsToTimestamp(seconds){

	d = Number(seconds);
	var h = Math.floor(d / 3600);
	var m = Math.floor(d % 3600 / 60);
	var s = Math.floor(d % 3600 % 60);
	return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);

};

module.exports = function(transcriptions){

	let VTT = 'WEBVTT\n\n';

	transcriptions.forEach(t => {
		console.log(convertSecondsToTimestamp(t.timeOffsets.start) + " --> " + convertSecondsToTimestamp(t.timeOffsets.end));
		VTT += convertSecondsToTimestamp(t.timeOffsets.start) + " --> " + convertSecondsToTimestamp(t.timeOffsets.end) + "\n" + t.transcription + "\n\n";

		/*VTT += `${convertSecondsToTimestamp(t.timeOffsets.start)} --> ${convertSecondsToTimestamp(t.timeOffsets.end)}
${t.transcription}

		`;*/
	});

	return Promise.resolve(VTT);

};