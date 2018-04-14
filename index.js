const Config = require('./config.js');

exports.processFile = (event, callback) => {
	var fileName  = event.data.name;
	var file      = 'gs://' + event.data.bucket + '/' + fileName;
	var config    = new Config();

	var standupID = fileName.substr(fileName.indexOf('-') + 1, fileName.indexOf('.') - fileName.indexOf('-') - 1);

    config.execute(file, standupID, 'ajarvis_rest');
	callback();
};
