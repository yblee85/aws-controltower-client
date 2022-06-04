import AWS from 'aws-sdk';
import { getCrossAccountCredentials } from '../utils/helper';
import {promisify} from 'util';

const describeSubnets = async ( target_account_id, vpc_id ) => {
  // Get the Cross account credentials
  const accessparams = await getCrossAccountCredentials(target_account_id);

  // const serviceCatalogParam = { ...accessparams };

  let ec2 = new AWS.EC2({ apiVersion: '2016-11-15', ...accessparams });
  const describeSubnet_p = promisify(ec2.describeSubnets).bind(ec2)

  const param = {
    Filters : [
      {
        Name: "vpc-id",
        Values: [ vpc_id ]
      }
    ]
  }

  const resp = await describeSubnet_p(param);
  return resp;
  // {
  //   Subnets: [
  //     {
  //       AvailabilityZone: 'us-east-1a',
  //       AvailabilityZoneId: 'use1-az1',
  //       AvailableIpAddressCount: 251,
  //       CidrBlock: '10.0.0.0/24',
  //       DefaultForAz: false,
  //       MapPublicIpOnLaunch: false,
  //       MapCustomerOwnedIpOnLaunch: false,
  //       State: 'available',
  //       SubnetId: 'subnet-xxxxx',
  //       VpcId: 'vpc-xxxxxx',
  //       OwnerId: '111111',
  //       AssignIpv6AddressOnCreation: false,
  //       Ipv6CidrBlockAssociationSet: [],
  //       Tags: [],
  //       SubnetArn: 'arn:aws:ec2:us-east-1:111111:subnet/subnet-xxxxxx',
  //       EnableDns64: false,
  //       Ipv6Native: false,
  //       PrivateDnsNameOptionsOnLaunch: [Object]
  //     }
  //   ]
  // }
  
}

export {
  describeSubnets
}
