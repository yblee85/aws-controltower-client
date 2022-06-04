import AWS from 'aws-sdk';
import { getCrossAccountCredentials } from '../utils/helper';
import {promisify} from 'util';

const generateIpPermission = ({port, allowedIp, description}) => {
  return {
    FromPort: port,
    ToPort: port,
    IpProtocol: "tcp",
    IpRanges: [
      {
        CidrIp: allowedIp?`${allowedIp}/32`:"0.0.0.0/0",
        Description: description
      }
    ]
  }
}

const generateAcceptInternalTrafficPermission = (cidrBlock) => {
  return {
    FromPort: -1,
    ToPort: -1,
    IpProtocol: "-1",
    IpRanges: [
      {
        CidrIp: cidrBlock,
        Description: "Allow all internal traffic"
      }
    ]
  }
}

const generateAcceptSSHIpPermission = (allowedIp) => {
  return generateIpPermission({ port: 22, allowedIp, description: "Allow SSH from jumpbox" })
}

const generateAcceptHttpIpPermission = () => {
  return generateIpPermission({ port: 80, description: "Allow http" })
}

const generateAcceptHttpsIpPermission = () => {
  return generateIpPermission({ port: 443, description: "Allow https" })
}

const createSecurityGroup = async ( target_account_id, vpc_id, description, grp_name, ip_permissions ) => {
  const accessparams = await getCrossAccountCredentials(target_account_id);
  let ec2 = new AWS.EC2({ apiVersion: '2016-11-15', ...accessparams });

  // create sg
  const createSg_p = promisify(ec2.createSecurityGroup).bind(ec2)
  let param = {
    Description: description,
    GroupName: grp_name,
    VpcId: vpc_id
  }
  const createSgResult = await createSg_p(param)
  console.log("Security Group created")
  console.log(createSgResult)

  // attach iprule
  const attachIpRule_p = promisify(ec2.authorizeSecurityGroupIngress).bind(ec2)
  let ipruleParam = {
    GroupId: createSgResult.GroupId,
    IpPermissions: ip_permissions
  }
  const attachIpRuleResult = await attachIpRule_p(ipruleParam)
  console.log("Ingress Rull attached to the Security Group")
  console.log(attachIpRuleResult)

  return attachIpRuleResult
}

const createSecurityGroups = async ( target_account_id, vpc_id, jumpbox_ip, cidr_block ) => {
  // create security groups
  let liPromises = [
    createSecurityGroup(
      target_account_id,
      vpc_id,
      "allow-jumpbox",
      "allow ssh from jumpbox",
      [ generateAcceptSSHIpPermission(jumpbox_ip) ]
    ),
    createSecurityGroup(
      target_account_id,
      vpc_id,
      "allow-http-s",
      "allow http/https from anywhere",
      [ generateAcceptHttpIpPermission(), generateAcceptHttpsIpPermission() ]
    ),
    createSecurityGroup(
      target_account_id,
      vpc_id,
      "allow-internal",
      "allow internal traffic",
      [ generateAcceptInternalTrafficPermission(cidr_block)]
    )
  ]

  let liResults = await Promise.all(liPromises)
  return liResults
}

const describeSecurityGroups = async ( target_account_id, vpc_id ) => {
  // Get the Cross account credentials
  const accessparams = await getCrossAccountCredentials(target_account_id);

  // const serviceCatalogParam = { ...accessparams };

  let ec2 = new AWS.EC2({ apiVersion: '2016-11-15', ...accessparams });
  const describeSg_p = promisify(ec2.describeSecurityGroups).bind(ec2)

  const param = {
    Filters : [
      {
        Name: "vpc-id",
        Values: [ vpc_id ]
      }
    ]
  }

  const resp = await describeSg_p(param);
  console.log(resp);
  // {
  //   SecurityGroups: [
  //     {
  //       Description: 'default VPC security group',
  //       GroupName: 'default',
  //       IpPermissions: [Array],
  //       OwnerId: '11111',
  //       GroupId: 'sg-xxxxx',
  //       IpPermissionsEgress: [Array],
  //       Tags: [],
  //       VpcId: 'vpc-xxxxxx'
  //     },
  //     {
  //       Description: 'allow internal traffic',
  //       GroupName: 'allow-internal',
  //       IpPermissions: [Array],
  //       OwnerId: '11111111',
  //       GroupId: 'sg-xxxxxx',
  //       IpPermissionsEgress: [Array],
  //       Tags: [],
  //       VpcId: 'vpc-xxxxxxx'
  //     },
  //     {
  //       Description: 'allow ssh from jumpbox',
  //       GroupName: 'allow-jumpbox',
  //       IpPermissions: [Array],
  //       OwnerId: '11111111',
  //       GroupId: 'sg-xxxxxxxx',
  //       IpPermissionsEgress: [Array],
  //       Tags: [],
  //       VpcId: 'vpc-xxxxx'
  //     },
  //     {
  //       Description: 'allow http/https from anywhere',
  //       GroupName: 'allow-http-s',
  //       IpPermissions: [Array],
  //       OwnerId: '11111111',
  //       GroupId: 'sg-xxxxxxxx',
  //       IpPermissionsEgress: [Array],
  //       Tags: [],
  //       VpcId: 'vpc-xxxxxxx'
  //     }
  //   ]
  // }
  
}

export {
  createSecurityGroups,
  describeSecurityGroups
};
