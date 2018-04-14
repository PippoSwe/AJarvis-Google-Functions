const speech  = require('@google-cloud/speech');
const config  = require('./config.js');
const NLP     = require('./NLP.js');
const http    = require('http');

var standupIDGlobal = '';

const configSpeech = {
    encoding:        'FLAC',
    languageCode:    'it-IT',
    singleUtterance: true
};

// ajarvis config var
var projectId;
var ajarvis_ip;
var ajarvis_port;
var config_data;

function Speech() {}

Speech.prototype.execute = function (filePath, standupID, config_json) {
    console.log('Componente SPEECH in esecuzione, standupID: ' + standupID);

    config_data  = config_json;
    projectId    = config_json.projectId;
    ajarvis_ip   = config_json.host;
    ajarvis_port = config_json.port;

    standupIDGlobal = standupID;

    const speech_client = new speech.SpeechClient({
        projectId: projectId
    });
    const audio = {
        uri: filePath
    };
    const request = {
        config: configSpeech,
        audio: audio
    };
    speech_client.longRunningRecognize(request)
        .then(data => {
        const operation = data[0];
        return operation.promise();
    }).then(speechTerminated).catch(speechError);
};

function speechTerminated(data) {
    console.log('speechTeminated()');

    const response    = data[0];

    /* old fixing with replace upper letter with dots
    var transcription = response.results.map(result => result.alternatives[0].transcript).join('. ');
    transcription = fixDotsPositioning(transcription);
    */

    console.log('Transcription result: ' + transcription);

    speechReporting(true, transcription);
};

function speechError(error) {
    console.log('Standup ' + standupIDGlobal + ': conversione STT fallita. Errore: ' + error);
    speechReporting(false, '');
};

function speechReporting(success, text) {
    var jsonObject;

    if (success == true)
        jsonObject = 'status=Success';
    else
        jsonObject = 'status=Failed';

    console.log('speechReporting: ' + jsonObject);

    const postHeaders = {
        'Content-Type' : 'application/json',
        'Content-Length' : Buffer.byteLength(jsonObject, 'utf8')
    };

    var optionsPost = {
        host : ajarvis_ip,
        port : ajarvis_port,
        path : '/api/queue/' + standupIDGlobal + '/stt/',
        method : 'PUT',
        headers : postHeaders
    };

    var reqPost = http.request(optionsPost, function(res) {
        console.log('Standup ' + standupIDGlobal + ': notifica STT avvenuta con successo', res.statusCode);
        res.on('data', function(d) {});
    });

    reqPost.write(jsonObject);
    reqPost.end();
    reqPost.on('error', function(error) {
        console.error('Standup ' + standupIDGlobal + ': errore invio notifica NLP. Errore: ' + error);
    });

    if(success){
        var nlp = new NLP();
        nlp.execute(text, standupIDGlobal, config_data);
    }
};

/*
    add before upper case letter a dot
*/
function fixDotsPositioning(text)
{
    var result = text.substr(0,1) + text.substr(1).replace(/([A-Z])/g, ". $1");

    //remove double dots
    result = result.replace('. .','. ');
    result = result.replace('..','. ');

    return result;
}

module.exports = Speech;
