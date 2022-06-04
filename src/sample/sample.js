/*
prerequisite
1. you have aws root account and created control tower
2. and you already created sub account that is AVAILABLE
3. id_ed25519 and id_ed25519.pub files are in ssh directory 

scenario
create vpc -> create security groups -> import keypairs -> create ec2
*/

import AWS from 'aws-sdk';
import { getCrossAccountCredentials } from '../utils/helper';
import {promisify} from 'util';

import { createVpcWithResources } from '../vpc/vpc_manager';
import { createSecurityGroups } from '../vpc/securitygroups_manager';
import { importKeyPair } from '../keypairs/keypairs_manager';
import { createEc2 } from '../ec2/ec2_manager';

const target_account_id = "12322432432423";
const cidr_block = "10.0.0.0/24";
const region  = "us-east-1";

// do 1 ~ 4, one by one

// 1. create vpc
// createVpcWithResources(target_account_id, region, cidr_block)
// .then(result=>{
//   console.log(result);
//   console.log("vpc created");
// })
// .catch(err=>{
//   console.log(err);
//   console.log("vpc creation fail");
// })

// 2. wait until vpc is created and get the vpc_id from result above
// const vpc_id = "vpc-123123123"; // you get this result from 1.
// const my_computer_ip = "111.111.111.111";
// createSecurityGroups(target_account_id, vpc_id, my_computer_ip, cidr_block)
// .then(result=>{
//   console.log(result);
//   console.log("sgs created");
// })
// .catch(err=>{
//   console.log(err);
//   console.log("sgs creation fail");
// });

// 3. wait until 2 is done and then import key pairs
// importKeyPair(target_account_id, "MyKey", "../../id_ed25519.pub")
// .then(result=>{
//   console.log(result);
//   console.log("key imported");
// })
// .catch(err=>{
//   console.log(err);
//   console.log("key import fail");
// })

// 4. wait until 3 is done and then create ec2
// createEc2(target_account_id, vpc_id)
// .then(result=>{
//   console.log(result);
//   console.log("ec2 created");
// })
// .catch(err=>{
//   console.log(err);
//   console.log("ec2 creation fail");
// })
