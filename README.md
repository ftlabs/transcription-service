# FT Labs Transcription Service.
Time-based transcriptions of media content, powered by Google's Speech APIs

This service currentlty lives on [Heroku](https://ftlabs-transcription.herokuapp.com).

## Media Formats

This service can transcribe the following media formats:
- mp4
- wav
- mp3
- ogg
- m4a
- mxf

Any files sent to the service for transcription must not be larger than **419430400 bytes** (40 mb). If a file is uploaded/a resource is passed to the service, and it is too big, the transcription will not be performed.

## Usage

There are two ways to start a transcription:

1. You can pass a file to `/transcribe` as binary data
2. You can pass a URL that points to a valid media file

In order to start a transcription, you must obtain a token to include in your request as a query parameter

### Acquiring A token

Tokens can only be created by FT staff. 

To create a token head to [/token/generate](https://ftlabs-transcription.herokuapp.com/token/generate).

This endpoint is protected by S3O. If authentication is successful, you'll receieve a JSON response containing your token, and your S3O username.

```
{
	token: "VALID_TOKEN",
	owner: "your.name"
}
```

For every other endpoint, this token must be included as a query parameter ```?token=VALID_TOKEN```.

### Posting a file for transcription

You can upload a file for transcription like so:

`curl --request POST --data-binary "@file_to_transcribe.mp3" https://ftlabs-transcription.herokuapp.com/transcribe?token=VALID_TOKEN`

### Passing a resource for transcriptions


### Once the resource has been receieved

If the upload is successful, a JSON object will be returned with a stauts, id, and a helpful message about what you can do with the id.

```
{
	"status": "ok",
	"id" : "VALID_ID"
	"message": "Job created. Please check https://ftlabs-transcription.herokuapp.com/get/VALID_ID to get status/transcription."
}
```

### Checking and getting your transcription

Transcriptions take time (01:30s per 5 minutes of audio as a rule-of-thumb). You can check the status of the transcription process by visiting:

`https://ftlabs-transcription.herokuapp.com/get/YOUR_JOB_ID`


If the job is not finished, you'll recieve:

```
{
	"ID": "YOUR_JOB_ID",
	"finished": false
}
```

if the job is finished, you'll recieved a JSON object with both the whole transcrition, and the time indexed chunks:

```
{
	"ID": "ryepEUJYwg",
	"finished": true,
	"transcription": {
		"whole": "This is just a short demo of the transcription service",
		"transcribedChunks": [
			{
				"transcription": "This is just a short",
				"timeOffsets": {
					"start": 0,
					"end": 01.86,
					"duration": 01.86
				}
			},
			{
				"transcription": "demo of the transcription service",
				"timeOffsets": {
					"start": 01.86,
					"end": 03.18,
					"duration": 01.32
				}
			}
		]
	}
}
```

You can also have the transcription returned as a VTT file by passing adding a query parameter to the GET request. 

`https://ftlabs-transcription.herokuapp.com/get/YOUR_JOB_ID?output=vtt`

This will not trigger a new transcription, it will rearrange the existing data into the VTT format.

```
WEBVTT

1
00:00:00.000 --> 00:01:86.000
This is just a short

2
00:01:86.000 --> 00:03:18.000
demo of the transcription service

```

## Languages

The transcription service can transcribe files with different languages in them (though it cannot distinguish between more than one language per file). Telling the service which language the media file you wish to have transcribed predominantly features will likely improve the quality of that transcription.

By default, all media files are assumed to be **British English**, and will be transcribed as such.

To specify a language to be used in the transcription process, pass the language code with a query parameter when you make a request to the transcribe endpoint.

```?token=[VALID_TOKEN]&languagecode=en-us```

For a list of supported language codes, [refer here](https://cloud.google.com/speech/docs/languages).