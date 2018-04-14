const storage      = require('@google-cloud/storage');
const bucketName   = 'ajarvis-config';
const ajarvis_rest = 'ajarvis_rest.json';
const Speech       = require('./speech.js');
const request      = require('request');

var fileName;
var standupID;

function Config() {}

/*
	config = name of file to get
*/
Config.prototype.execute = function(audioFile, standup_id, config){
	fileName  = audioFile;
	standupID = standup_id;

	var file_name = '';

	switch(config){
		case 'ajarvis_rest': file_name = ajarvis_rest; break;
	}

    var storage_client = new storage();
    var myBucket       = storage_client.bucket(bucketName);
    var file           = myBucket.file(file_name);

    file
    .download({validation: false})
    .then(startProcess)
    .catch(configError);
}

function startProcess(data) {
	data = data.toString('utf-8');

    var config_json  = data;
    var config_data  = JSON.parse(config_json);
    var ajarvis_ip   = config_data.host;
    var ajarvis_port = config_data.port;
    var url          = 'http://' + ajarvis_ip + ':' + ajarvis_port + '/api/queue';

    console.log('Ajarvis is on ' + url);
    console.log('Now we start Speech with: ' + fileName + ' ' + standupID);

    var speech = new Speech();

    console.log('Speech variable initialized');

    speech.execute(fileName, standupID, config_data);

    /*

	var options = {
        host : ajarvis_ip,
        port : ajarvis_port,
        path : '/api/queue',
        method : 'GET'
    };


    var url = 'http://' + ajarvis_ip + ':' + ajarvis_port + '/api/queue';
    console.log('Verifico stato server su: ' + url);

    request(url, { json: true }, (err, res, body) => {
        if(res.statusCode == 200){
            console.log('Ajarvis on ' + ajarvis_ip + ':' + ajarvis_port + ' è disponibile. standupID: ' + standupID);
            var speech = new Speech();

            speech.execute(fileName, standupID, config_json);
        }

        if (err) {
            console.log('ERORRE ' + err);
        }

        if(res.statusCode != 200){
            console.log('ERRORE: statusCode' + res.statusCode);
        }
    });*/
}

function configError(error) {
	console.log('Caricamento file config errato: ' + error);
}

module.exports = Config;
