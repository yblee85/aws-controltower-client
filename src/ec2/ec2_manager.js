import AWS from 'aws-sdk';
import { getCrossAccountCredentials } from '../utils/helper';
import { describeSubnets } from '../vpc/subnet_manager';
import { describeSecurityGroups } from '../vpc/securitygroups_manager';
import {promisify} from 'util';

const createEc2 = async (target_account_id, vpc_id) => {
  // Get the Cross account credentials
  const accessparams = await getCrossAccountCredentials(target_account_id);

  let ec2 = new AWS.EC2({ apiVersion: '2016-11-15', ...accessparams });

  const subnetResult = await describeSubnets(target_account_id, vpc_id);
  const subnetId = subnetResult.Subnets[0].SubnetId;
  
  const sgsResult = await describeSecurityGroups(target_account_id, vpc_id);
  const sg_ids = sgsResult.SecurityGroups.filter(sg => sg.GroupName !== 'default').map(sg => sg.GroupId);

  // create ec2
  const runInstances_p = promisify(ec2.runInstances).bind(ec2)
  const ec2Params = {
    // DryRun : true,
    ImageId: process.env.AMI_ID, //"ami-0aee2d0182c9054ac", 
    InstanceType: "t2.micro", 
    KeyName: "MyKey", // This has to be present in KeyPairs
    MaxCount: 1, 
    MinCount: 1, 
    SecurityGroupIds: sg_ids, 
    SubnetId: subnetId, 
    TagSpecifications: [
       {
      ResourceType: "instance", 
      Tags: [
         {
        Key: "Purpose", 
        Value: "test"
       }
      ]
     }
    ]
  };
  const createEc2Result = await runInstances_p(ec2Params)
  console.log("ec2 created")
  console.log(JSON.stringify(createEc2Result))
  // {
  //   "Groups": [],
  //   "Instances": [
  //     {
  //       "AmiLaunchIndex": 0,
  //       "ImageId": "ami-xxxxxxx",
  //       "InstanceId": "i-xxxxxxxx",
  //       "InstanceType": "t2.micro",
  //       "KeyName": "MyKey",
  //       "LaunchTime": "2022-03-23T15:53:21.000Z",
  //       "Monitoring": {
  //         "State": "disabled"
  //       },
  //       "Placement": {
  //         "AvailabilityZone": "us-east-1a",
  //         "GroupName": "",
  //         "Tenancy": "default"
  //       },
  //       "PrivateDnsName": "ip-10-0-0-105.us-east-1.compute.internal",
  //       "PrivateIpAddress": "10.0.0.105",
  //       "ProductCodes": [],
  //       "PublicDnsName": "",
  //       "State": {
  //         "Code": 0,
  //         "Name": "pending"
  //       },
  //       "StateTransitionReason": "",
  //       "SubnetId": "subnet-xxxxxxx",
  //       "VpcId": "vpc-xxxxxxxxxx",
  //       "Architecture": "x86_64",
  //       "BlockDeviceMappings": [],
  //       "ClientToken": "xxxxx-xxxxx-xxxxx-xxxx-xxxxxxx",
  //       "EbsOptimized": false,
  //       "EnaSupport": true,
  //       "Hypervisor": "xen",
  //       "ElasticGpuAssociations": [],
  //       "ElasticInferenceAcceleratorAssociations": [],
  //       "NetworkInterfaces": [
  //         {
  //           "Attachment": {
  //             "AttachTime": "2022-03-23T15:53:21.000Z",
  //             "AttachmentId": "eni-attach-xxxxxxx",
  //             "DeleteOnTermination": true,
  //             "DeviceIndex": 0,
  //             "Status": "attaching",
  //             "NetworkCardIndex": 0
  //           },
  //           "Description": "",
  //           "Groups": [
  //             {
  //               "GroupName": "allow-https",
  //               "GroupId": "sg-xxxxxxx"
  //             },
  //             {
  //               "GroupName": "allow-ssh",
  //               "GroupId": "sg-xxxxxxx"
  //             },
  //             {
  //               "GroupName": "allow-http",
  //               "GroupId": "sg-xxxxxxxx"
  //             }
  //           ],
  //           "Ipv6Addresses": [],
  //           "MacAddress": "xx:xx:xx:xx:xx:xx",
  //           "NetworkInterfaceId": "eni-xxxxxx",
  //           "OwnerId": "11111111111",
  //           "PrivateIpAddress": "10.0.0.105",
  //           "PrivateIpAddresses": [
  //             {
  //               "Primary": true,
  //               "PrivateIpAddress": "10.0.0.105"
  //             }
  //           ],
  //           "SourceDestCheck": true,
  //           "Status": "in-use",
  //           "SubnetId": "subnet-xxxxxx",
  //           "VpcId": "vpc-xxxxxx",
  //           "InterfaceType": "interface",
  //           "Ipv4Prefixes": [],
  //           "Ipv6Prefixes": []
  //         }
  //       ],
  //       "RootDeviceName": "/dev/sda1",
  //       "RootDeviceType": "ebs",
  //       "SecurityGroups": [
  //         {
  //           "GroupName": "allow-https",
  //           "GroupId": "sg-xxxxx"
  //         },
  //         {
  //           "GroupName": "allow-ssh",
  //           "GroupId": "sg-xxxxxx"
  //         },
  //         {
  //           "GroupName": "allow-http",
  //           "GroupId": "sg-xxxxxx"
  //         }
  //       ],
  //       "SourceDestCheck": true,
  //       "StateReason": {
  //         "Code": "pending",
  //         "Message": "pending"
  //       },
  //       "Tags": [
  //         {
  //           "Key": "Purpose",
  //           "Value": "test"
  //         }
  //       ],
  //       "VirtualizationType": "hvm",
  //       "CpuOptions": {
  //         "CoreCount": 1,
  //         "ThreadsPerCore": 1
  //       },
  //       "CapacityReservationSpecification": {
  //         "CapacityReservationPreference": "open"
  //       },
  //       "Licenses": [],
  //       "MetadataOptions": {
  //         "State": "pending",
  //         "HttpTokens": "optional",
  //         "HttpPutResponseHopLimit": 1,
  //         "HttpEndpoint": "enabled",
  //         "HttpProtocolIpv6": "disabled",
  //         "InstanceMetadataTags": "disabled"
  //       },
  //       "EnclaveOptions": {
  //         "Enabled": false
  //       },
  //       "PrivateDnsNameOptions": {
  //         "HostnameType": "ip-name",
  //         "EnableResourceNameDnsARecord": false,
  //         "EnableResourceNameDnsAAAARecord": false
  //       }
  //     }
  //   ],
  //   "OwnerId": "111111",
  //   "ReservationId": "r-111111111"
  // }

  // allocateAddress (create elastic ip)
  var ipParams = {
    Domain: "vpc"
   };
   const allocateAddress_p = promisify(ec2.allocateAddress).bind(ec2)
   const createIpResult = await allocateAddress_p(ipParams)
  console.log("ip created")
  console.log(createIpResult)
  /*
     data = {
      AllocationId: "eipalloc-xxxxxx", 
      Domain: "vpc", 
      PublicIp: "111.111.111.111"
     }
     */

  // need to wait until ec2 is not pending
  var waitForParams = {
    InstanceIds : [ createEc2Result.Instances[0].InstanceId ]
  };
  console.log("instance status checking...")
  const waitFor_p = promisify(ec2.waitFor).bind(ec2)
  const waitForResult = await waitFor_p("instanceRunning", waitForParams)
  console.log("instance running")
  console.log(waitForResult)

  // associateAddress
  var attachIpparams = {
    AllocationId: createIpResult.AllocationId, 
    InstanceId: createEc2Result.Instances[0].InstanceId
   };
   const associateAddress_p = promisify(ec2.associateAddress).bind(ec2)
   const attachIpResult = await associateAddress_p(attachIpparams)
  console.log("ip attached")
  console.log(attachIpResult)
 /*
    data = {
    AssociationId: "eipassoc-xxxxxxx"
    }
    */

  return true;

}

export {
  createEc2
}
