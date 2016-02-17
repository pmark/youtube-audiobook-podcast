var s3 = require('s3');
var path = require('path');
var config = require('./s3-config.json');
var tmp = require('tmp');
var fs = require('fs');
var path = require('path');
var Constants = require('./constants');
var util = require('./util');
var moment = require('moment');
var md5File = require('md5-file');
var Promise = require('bluebird');
var rp = require('request-promise');

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default 
  s3RetryCount: 3,    // this is the default 
  s3RetryDelay: 1000, // this is the default 
  multipartUploadThreshold: 20971520, // this is the default (20 MB) 
  multipartUploadSize: 15728640, // this is the default (15 MB) 
  s3Options: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    // logger: process.stdout,
    httpOptions: {
      timeout: 60000 * 5,  // default is 120000 (2 minutes)
    },
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
    uploader.on('progress', () => progress(uploader));
    uploader.on('end', function() {
      console.log('done uploading');
      resolve();
    });

  });
};

S3.uploadJSON = function(data, bucketPath) {
  var tmpobj = tmp.fileSync();
  fs.writeFileSync(tmpobj.name, JSON.stringify(data));
  return S3.uploadFile(tmpobj.name, bucketPath);
};

S3.uploadFile = function(filePath, bucketPath) {

  var checksum = md5File(filePath);
  var fileDestURI = `http://martianrover.com/${bucketPath}`;
  var skipUpload = false;

  rp.head(fileDestURI)
  .then(function(headers) {      
    var etag = headers.etag ? headers.etag.replace(/"/g, '') : null;
    console.log('HEAD', fileDestURI, 'etag:', etag, 'checksum:', checksum);

    if (etag === checksum) {
      skipUpload = true;
      console.log('Already uploaded');
    }
  })
  .catch((err) => {
    if (err.statusCode !== 404) {
      console.log('HEAD request error for', fileDestURI, ':\n', err);        
    }
  });

  return new Promise(function(resolve, reject) {
    if (skipUpload) {
      return resolve();
    }

    var params = {
      localFile: filePath,
     
      s3Params: {
        Bucket: 'martianrover.com',
        Key: bucketPath,
        // ContentMD5: checksum,  // leave off for S3 to generate its own
        // other options supported by putObject, except Body and ContentLength. 
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
      },
    };

    console.log('Uploading', filePath); //, 'with params:', params.s3Params);
    var uploader = client.uploadFile(params);
    uploader.on('error', function(err) {
      console.error('unable to upload', params.s3Params.Key, err);
      reject(err);
    });
    uploader.on('progress', () => progress(uploader));
    uploader.on('end', function() {
      console.log('done uploading file to s3');
      resolve();
    });

  });
};

S3.uploadDir = function(localDir) {
  var slug = path.basename(localDir);
  var files = util.listFiles(localDir).sort();
  console.log('files:', files);

  return Promise.map(files, (filePath) => {
    var fileName = path.basename(filePath);
    var bucketPath = `assets/audiobooks/${slug}/${fileName}`;
    return S3.uploadFile(filePath, bucketPath);
  },
  {
    concurrency: 1,
  })
  .then((allResults) => {
    console.log('Done uploading dir.');
  });

};

////////////////////////////////////////////////////////

var outputAt = moment();
function progress(uploader) {
  var now = moment();
  var secSinceLastOutput = now.diff(outputAt) / 1000;
  // console.log('secSinceLastOutput', secSinceLastOutput);
  if (secSinceLastOutput > 5) {
    console.log('progress', uploader.progressAmount, uploader.progressTotal);
    outputAt = now;
  }
}

module.exports = S3;

// syncDir('downloads/hocus-pocus-by-kurt-vonnegut')
// syncDir('downloads/test')
