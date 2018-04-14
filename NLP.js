const language = require('@google-cloud/language');
const http = require('http');
const features = {
    extractDocumentSentiment: true,
    extractSyntax: true,
    extractEntities:true
};

var standupIDGlobal = '';

// ajarvis config var
var ajarvis_ip;
var ajarvis_port;

function NLP() {}

NLP.prototype.execute = function(text, standupID, config_json){
    console.log('Componente NLP in esecuzione, standup_id ' + standupID);

    ajarvis_ip   = config_json.host;
    ajarvis_port = config_json.port;

    standupIDGlobal = standupID;

    console.log('NLP: ' + ajarvis_ip + ' ' + ajarvis_port);

    const document = {
        content: text,
        type: 'PLAIN_TEXT',
        language: 'it'
    };

    const request = {
        features: features,
        document: document
    };

    var client = new language.v1.LanguageServiceClient();
    var p = client.annotateText(request).then(NLPTerminated).catch(NLPError);
}

function NLPTerminated(results) {
    console.log('NLPTerminated');
    var json_result = JSON.stringify(results[0]);
    NLPReporting(true, json_result);
}

function NLPError(error) {
    console.log('NLPError');
    NLPReporting(false, '');
}

function NLPReporting(success, json){
    console.log('NLPReporting');
    var jsonObject;
    var path;
    var method;

    if(success == true) {
        jsonObject = json;
        path = '/api/standup/' + standupIDGlobal + '/nlp/';
        method = 'POST';
    }
    else{
        jsonObject = 'status=Failed';
        path = '/api/queue/' + standupIDGlobal + '/nlp/';
        method = 'PUT';
    }

    console.log(jsonObject);

    const postHeaders = {
        'Content-Type' : 'application/json',
        'Content-Length' : Buffer.byteLength(jsonObject, 'utf8')
    };

    var optionsPost = {
        host : ajarvis_ip,
        port : ajarvis_port,
        path : path,
        method : method,
        headers : postHeaders
    };

    var reqPost = http.request(optionsPost, function(res) {
        console.log('Standup ' + standupIDGlobal + ': notifica NLP avvenuta con status: ', res.statusCode);
        console.log(res.statusMessage);

        res.on('data', function(chunk) {
            console.log('BODY: ' + chunk);
        });
    });

    reqPost.write(jsonObject);
    reqPost.end();
    reqPost.on('error', function(error) {
        console.error('Standup ' + standupIDGlobal + ': errore invio notifica NLP. Errore: ' + error);
    });
}

module.exports = NLP;