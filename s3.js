
var s3 = require('s3');
var path = require('path');
var config = require('./s3-config.json');
var tmp = require('tmp');
var fs = require('fs');
var Constants = require('./constants');

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default 
  s3RetryCount: 3,    // this is the default 
  s3RetryDelay: 1000, // this is the default 
  multipartUploadThreshold: 20971520, // this is the default (20 MB) 
  multipartUploadSize: 15728640, // this is the default (15 MB) 
  s3Options: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    // any other options are passed to new AWS.S3() 
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
  },
});

var S3 = {};

S3.syncDir = function(localDir) {
  var dirName = path.basename(localDir);

  return new Promise(function(resolve, reject) {

    var params = {
      localDir: localDir,
      deleteRemoved: false, // default false, whether to remove s3 objects 
                            // that have no corresponding local file. 
     
      s3Params: {
        Bucket: 'martianrover.com',
        Prefix: 'assets/audiobooks/' + dirName + '/',
        // other options supported by putObject, except Body and ContentLength. 
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
      },
    };
    console.log('sync params:', params);

    var uploader = client.uploadDir(params);
    uploader.on('error', function(err) {
      console.error('unable to sync:', err.stack);
      reject(err);
    });
    uploader.on('progress', function() {
      console.log('progress', uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function() {
      console.log('done uploading');
      resolve();
    });

  });
};

S3.uploadJSON = function(data, bucketPath) {
  var tmpobj = tmp.fileSync();
  console.log("tmp file: ", tmpobj.name);

  fs.writeFileSync(tmpobj.name, JSON.stringify(data));
  return S3.uploadFile(tmpobj.name, Constants.PODCASTS_JSON_PATH);
};

S3.uploadFile = function(filePath, bucketPath) {
  return new Promise(function(resolve, reject) {
    var params = {
      localFile: filePath,
     
      s3Params: {
        Bucket: 'martianrover.com',
        Key: bucketPath,
        // other options supported by putObject, except Body and ContentLength. 
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
      },
    };

    console.log('Uploading', filePath);
    var uploader = client.uploadFile(params);
    uploader.on('error', function(err) {
      console.error('unable to upload:', err.stack);
      reject(err);
    });
    uploader.on('progress', function() {
      console.log('progress', uploader.progressMd5Amount,
                uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function() {
      console.log('done uploading file to s3');
      resolve();
    });
  });
};

module.exports = S3;

// syncDir('downloads/hocus-pocus-by-kurt-vonnegut')
// syncDir('downloads/test')
