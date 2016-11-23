// run-on-ec2.js

var config = require('./s3-config.json');
var aws = require('aws-ec2')(config.accessKeyId, config.secretAccessKey);

var instanceId = 'i-b603b286';
var options = {
  InstanceId: instanceId,
  'numToLaunch':1,
  'ami':'myAMI',
  'awsZone':'us-east-1a',
  'instanceType':'t2-nano',
  'securityGroups':["Production", "Web"]
};

aws.getInstanceDescriptionFromId(instanceId, function (err, response) {
  console.log('getInstanceDescriptionFromId', err, response);
});

// aws.launchOnDemandInstances(options, function (err, response) {
//   instanceId = response.item.instanceId;
// });
