import AWS from 'aws-sdk';
import { getCrossAccountCredentials } from '../utils/helper';
import {promisify} from 'util';

const delete_default_vpc = async (credentials, region) => {
  console.log(`REGION : ${region}`)
  let ec2_in_the_region = new AWS.EC2({apiVersion: '2016-11-15', region, ...credentials });
  const ec2_describe_vpcs_p = promisify(ec2_in_the_region.describeVpcs).bind(ec2_in_the_region)
  let vpcResp = await ec2_describe_vpcs_p({});
  console.log(vpcResp)
  
  let foundDefaultVPC = vpcResp.Vpcs.find(v => v.InstanceTenancy === 'default');
  
  console.log(`Found Default VPC : ${JSON.stringify(foundDefaultVPC)}`)
  
  if(!foundDefaultVPC)
      return undefined
      
  let default_vpc_id = foundDefaultVPC.VpcId;
  
  console.log(`"Default VPC ID : ${default_vpc_id}"`)
  
  // delete subnets
  const ec2_describe_subnets_p = promisify(ec2_in_the_region.describeSubnets).bind(ec2_in_the_region)
  let subnetResp = await ec2_describe_subnets_p({});
  
  let default_subnet_ids = subnetResp.Subnets.map(s => s.SubnetId);
  
  console.log(`default subnset ids : ${JSON.stringify(default_subnet_ids)}`)
  
  const ec2_delete_subnet_p = promisify(ec2_in_the_region.deleteSubnet).bind(ec2_in_the_region)
  for(let sid of default_subnet_ids) {
      let tresp = await ec2_delete_subnet_p({SubnetId : sid})
      console.log(tresp)
  }
  console.log(`subnet deleted`)
  
  // delete igw
  const ec2_describe_igws_p = promisify(ec2_in_the_region.describeInternetGateways).bind(ec2_in_the_region)
  let igwParam = {
    Filters: [
      {
          Name: "attachment.vpc-id", 
          Values: [default_vpc_id]
      }
    ]
   };
  let igwResp = await ec2_describe_igws_p(igwParam);
  
  console.log(`igw : ${JSON.stringify(igwResp)}`)
  
  let default_igw_ids = igwResp.InternetGateways.map(s => s.InternetGatewayId);
  console.log(`igw ids : ${JSON.stringify(default_igw_ids)}`)
  
  // detach igws
  const ec2_detach_igw_p = promisify(ec2_in_the_region.detachInternetGateway).bind(ec2_in_the_region)
  for(let igwid of default_igw_ids) {
      let param = {
          VpcId : default_vpc_id,
          InternetGatewayId : igwid
      }
      let tresp = await ec2_detach_igw_p(param)
      console.log(tresp)
  }
  
  console.log(`igw detached`)
  
  // delete igws
  const ec2_delete_igw_p = promisify(ec2_in_the_region.deleteInternetGateway).bind(ec2_in_the_region)
  for(let igwid of default_igw_ids) {
      let param = {
          InternetGatewayId : igwid
      }
      let tresp = await ec2_delete_igw_p(param)
      console.log(tresp)
  }
  console.log(`igw deleted`)
  
  // delete endpoint
  const ec2_describe_endpoint_p = promisify(ec2_in_the_region.describeVpcEndpoints).bind(ec2_in_the_region)
  let endParam = {
    Filters: [
      {
          Name: "vpc-id", 
          Values: [default_vpc_id]
      }
    ]
   };
  let endResp = await ec2_describe_endpoint_p(endParam);
  let endpoint_ids = endResp.VpcEndpoints.map(e => e.VpcEndpointId)
  
  console.log(`endpoint_ids : ${JSON.stringify(endpoint_ids)}`)
  
  if(endpoint_ids && endpoint_ids.length>0) {
      const ec2_delete_endpoint_p = promisify(ec2_in_the_region.deleteVpcEndpoints).bind(ec2_in_the_region)
      let deresp = await ec2_delete_endpoint_p({ VpcEndpointIds : endpoint_ids })
      console.log(deresp)    
  }
  console.log(`vpc endpoints deleted`)
  
  // delete route table
  const ec2_describe_routetable_p = promisify(ec2_in_the_region.describeRouteTables).bind(ec2_in_the_region)
  let rtParam = {
    Filters: [
      {
          Name: "vpc-id", 
          Values: [default_vpc_id]
      }
    ]
   };
  let rtResp = await ec2_describe_routetable_p(rtParam);
  console.log(`rtResp : ${JSON.stringify(rtResp)}`)
  let routetable_ids = rtResp.RouteTables.filter(e => (e.Associations.length === 0 || !e.Associations[0].Main)).map(e => e.RouteTableId)
  console.log(`routetable_ids : ${JSON.stringify(routetable_ids)} in ${region}`)
  
  if(routetable_ids && routetable_ids.length > 0) {
      const ec2_delete_routetable_p = promisify(ec2_in_the_region.deleteRouteTable).bind(ec2_in_the_region)
      for(let rid of routetable_ids) {
          let drtresp = await ec2_delete_routetable_p({ RouteTableId : rid })
          console.log(drtresp)
          console.log(`vpc routetable deleted : ${rid}`)
      }
  }
  console.log(`vpc routetables deleted`)
  
  // delete VPC
  const ec2_delete_vpc_p = promisify(ec2_in_the_region.deleteVpc).bind(ec2_in_the_region)
  let tresp = await ec2_delete_vpc_p({VpcId:default_vpc_id})
  console.log(tresp)
  console.log(`vpc deleted`)
  
  return true
  
}

const cleanupDefaultVpcs = async (target_account_id) => {
  console.log(`Target Account : ${target_account_id}`)
  
  const accessparams = await getCrossAccountCredentials(target_account_id);
  
  let ec2 = new AWS.EC2({apiVersion: '2016-11-15', ...accessparams});
  const ec2_describe_regions_p = promisify(ec2.describeRegions).bind(ec2)
  let regionResp = await ec2_describe_regions_p({});
  
  let region_names = regionResp.Regions.map(r => r.RegionName);
  
  console.log(`region_names : ${JSON.stringify(region_names)}`)
  
  for(let rname of region_names) {
      await delete_default_vpc(accessparams, rname)
  }

  return true
}

const createVpcWithResources = async (target_account_id, region, cidrblock) => {
  // Get the Cross account credentials
  const accessparams = await getCrossAccountCredentials(target_account_id);

  let ec2 = new AWS.EC2({ apiVersion: '2016-11-15', ...accessparams, region });

  // create vpc
  const createVpc_p = promisify(ec2.createVpc).bind(ec2)
  const vpcParam = {
    CidrBlock: cidrblock
  }
  const createVpcResult = await createVpc_p(vpcParam)
  console.log("vpc created")
  console.log(createVpcResult)
  // {
  //   Vpc: {
  //     CidrBlock: '10.0.0.0/24',
  //     DhcpOptionsId: 'dopt-xxxxxxxx',
  //     State: 'pending',  ( available )
  //     VpcId: 'vpc-xxxxxxxxx',
  //     OwnerId: '11111111',
  //     InstanceTenancy: 'default',
  //     Ipv6CidrBlockAssociationSet: [],
  //     CidrBlockAssociationSet: [ [Object] ],
  //     IsDefault: false,
  //     Tags: []
  //   }
  // }

  // create igw
  const igParam = {}
  const createIg_p = promisify(ec2.createInternetGateway).bind(ec2)
  const createIgResult = await createIg_p(igParam)
  console.log("internet gateway created")
  console.log(createIgResult)
  // {
  //   InternetGateway: {
  //     Attachments: [],
  //     InternetGatewayId: 'igw-xxxxxxx',
  //     OwnerId: '11111111',
  //     Tags: []
  //   }
  // }

  // attach igw to vpc
  const aigParam = {
    InternetGatewayId: createIgResult.InternetGateway.InternetGatewayId, 
    VpcId: createVpcResult.Vpc.VpcId
  }
  const attachIg_p = promisify(ec2.attachInternetGateway).bind(ec2)
  const attachIgResult = await attachIg_p(aigParam)
  console.log("internet gateway attached to vpc")
  console.log(attachIgResult)
  // {}

  // create subnet 
  const subnetParam = {
    CidrBlock: cidrblock,
    VpcId: createVpcResult.Vpc.VpcId
  }
  const createSubnet_p = promisify(ec2.createSubnet).bind(ec2)
  const createSubnetResult = await createSubnet_p(subnetParam)
  console.log("subnet created")
  console.log(createSubnetResult)
  // {
  //   Subnet: {
  //     AvailabilityZone: 'us-east-1b',
  //     AvailabilityZoneId: 'use1-az1',
  //     AvailableIpAddressCount: 251,
  //     CidrBlock: '10.0.0.0/24',
  //     DefaultForAz: false,
  //     MapPublicIpOnLaunch: false,
  //     State: 'available',
  //     SubnetId: 'subnet-xxxxxxx',
  //     VpcId: 'vpc-xxxxxx',
  //     OwnerId: '111111',
  //     AssignIpv6AddressOnCreation: false,
  //     Ipv6CidrBlockAssociationSet: [],
  //     Tags: [],
  //     SubnetArn: 'arn:aws:ec2:us-east-1:11111111:subnet/subnet-xxxxxxxx',
  //     EnableDns64: false,
  //     Ipv6Native: false,
  //     PrivateDnsNameOptionsOnLaunch: {
  //       HostnameType: 'ip-name',
  //       EnableResourceNameDnsARecord: false,
  //       EnableResourceNameDnsAAAARecord: false
  //     }
  //   }
  // }

  // find default route table 
  const drtParam = {
    Filters : [
      {
        Name: "vpc-id",
        Values: [ createVpcResult.Vpc.VpcId ]
      }
    ]
  }
  const describeRt_p = promisify(ec2.describeRouteTables).bind(ec2)
  const describeRtResult = await describeRt_p(drtParam)
  console.log("describe route table")
  console.log(describeRtResult)
  // {
  //   RouteTables: [
  //     {
  //       Associations: [Array],
  //       PropagatingVgws: [],
  //       RouteTableId: 'rtb-xxxxxx',
  //       Routes: [Array],
  //       Tags: [],
  //       VpcId: 'vpc-xxxxxxx',
  //       OwnerId: '11111111111'
  //     }
  //   ]
  // }
  const foundRouteTableId = describeRtResult.RouteTables[0].RouteTableId

  // create routes (adding ig)
  const rParam = {
    DestinationCidrBlock: "0.0.0.0/0", 
    GatewayId: createIgResult.InternetGateway.InternetGatewayId, 
    RouteTableId: foundRouteTableId
  }
  const createRoute_p = promisify(ec2.createRoute).bind(ec2)
  const createRouteResult = await createRoute_p(rParam)
  console.log("route created in route table")
  console.log(createRouteResult)
  // { Return: true }

  // asociate routetable with subnet
  const aParam = {
    RouteTableId: foundRouteTableId,
    SubnetId: createSubnetResult.Subnet.SubnetId
  }
  const associateRt_p = promisify(ec2.associateRouteTable).bind(ec2)
  const associateRtResult = await associateRt_p(aParam)
  console.log("associate a route table with a subnet")
  console.log(associateRtResult)
  // {
  //   AssociationId: 'rtbassoc-xxxxxxxx',
  //   AssociationState: { State: 'associated' }
  // }


  return true

}

const deleteVpc = async ( target_account_id, vpc_id ) => {
  const accessparams = await getCrossAccountCredentials(target_account_id);

  let ec2 = new AWS.EC2({ apiVersion: '2016-11-15', ...accessparams });

  // describe subnet for vpcid
  let dsParams = {
    Filters: [
       {
      Name: "vpc-id", 
      Values: [
        vpc_id
      ]
     }
    ]
   };
   const describeSubnets_p = promisify(ec2.describeSubnets).bind(ec2)
   const describeSubnetResult = await describeSubnets_p(dsParams)
    /*
    data = {
      Subnets: [
        {
        AvailabilityZone: "us-east-1c", 
        AvailableIpAddressCount: 251, 
        CidrBlock: "10.0.1.0/24", 
        DefaultForAz: false, 
        MapPublicIpOnLaunch: false, 
        State: "available", 
        SubnetId: "subnet-xxxxxx", 
        VpcId: "vpc-xxxxxx"
      }
      ]
    }
    */
   let subnet_ids = describeSubnetResult.Subnets.map(s => s.SubnetId)
      
  // delete subnet
  const deleteSubnet_p = promisify(ec2.deleteSubnet).bind(ec2)
  let liDeleteSubnetPromises = subnet_ids.map(sid => deleteSubnet_p({SubnetId: sid}))
  const liDeleteSubnetResult = await Promise.all(liDeleteSubnetPromises)
  console.log("subnets deleted")
  console.log(liDeleteSubnetResult)

    // describe route table
    let drtParams = {
      Filters: [
         {
        Name: "vpc-id", 
        Values: [
          vpc_id
        ]
       }
      ]
     };
     const describeRouteTables_p = promisify(ec2.describeRouteTables).bind(ec2)
     const describeRouteTableResult = await describeRouteTables_p(drtParams)
      /*
   data = {
    RouteTables: [
       {
      Associations: [
         {
        Main: true, 
        RouteTableAssociationId: "rtbassoc-xxxxx", 
        RouteTableId: "rtb-xxxxxx"
       }
      ], 
      PropagatingVgws: [
      ], 
      RouteTableId: "rtb-xxxxxx", 
      Routes: [
         {
        DestinationCidrBlock: "10.0.0.0/16", 
        GatewayId: "local", 
        State: "active"
       }
      ], 
      Tags: [
      ], 
      VpcId: "vpc-xxxxxx"
     }
    ]
   }
   */
     let routetable_ids = describeRouteTableResult.RouteTables.filter(s => !s.Associations[0].Main).map(s => s.RouteTableId)

   // delete route table
  const deleteRouteTable_p = promisify(ec2.deleteRouteTable).bind(ec2)
  let liDeleteRouteTablePromises = routetable_ids.map(sid => deleteRouteTable_p({RouteTableId: sid}))
  const liDeleteRouteTableResult = await Promise.all(liDeleteRouteTablePromises)
  console.log("route tables deleted")
  console.log(liDeleteRouteTableResult)

  // describe igw for vpcid
  let digwParams = {
    Filters: [
       {
      Name: "attachment.vpc-id", 
      Values: [
        vpc_id
      ]
     }
    ]
   };
   const describeIgws_p = promisify(ec2.describeInternetGateways).bind(ec2)
   const describeIgwsResult = await describeIgws_p(digwParams)
   /*
   data = {
    InternetGateways: [
       {
      Attachments: [
         {
        State: "available", 
        VpcId: "vpc-xxxxxx"
       }
      ], 
      InternetGatewayId: "igw-xxxxxx", 
      Tags: [
      ]
     }
    ]
   }
   */
   let igw_ids = describeIgwsResult.InternetGateways.map(i => i.InternetGatewayId)

   // detach igw
   const detachIgw_p = promisify(ec2.detachInternetGateway).bind(ec2)
  let liDetachIgwPromises = igw_ids.map(iid => detachIgw_p({InternetGatewayId: iid, vpc_id}))
  const liDetachIgwResult = await Promise.all(liDetachIgwPromises)
  console.log("internet gateways detached")
  console.log(liDetachIgwResult)

  // delete igw
  const deleteIgw_p = promisify(ec2.deleteInternetGateway).bind(ec2)
  let liDeleteIgwPromises = igw_ids.map(iid => deleteIgw_p({InternetGatewayId: iid}))
  const liDeleteIgwResult = await Promise.all(liDeleteIgwPromises)
  console.log("internet gateways deleted")
  console.log(liDeleteIgwResult)

  // describe s3 endpoint
  let epParams = {
    Filters: [
       {
      Name: "vpc-id", 
      Values: [
        vpc_id
      ]
     }
    ]
   };
   const describeEndpoints_p = promisify(ec2.describeVpcEndpoints).bind(ec2)
   const describeEndpointsResult = await describeEndpoints_p(epParams)
   let endpoint_ids = describeEndpointsResult.VpcEndpoints.map(i => i.VpcEndpointId)

   // delete endpoints
   if(endpoint_ids && endpoint_ids.length>0) {
     const deleteEndpoints_p = promisify(ec2.deleteVpcEndpoints).bind(ec2)
     const dEndpointsParam = {
      VpcEndpointIds : endpoint_ids
      }
      const deleteEndpointsResult = await deleteEndpoints_p(dEndpointsParam)
      console.log("vpc endpoints deleted")
      console.log(deleteEndpointsResult)
   }

   // describe security groups
   let sgParams = {
    Filters: [
       {
      Name: "vpc-id", 
      Values: [
        vpc_id
      ]
     }
    ]
   };
   const describeSgs_p = promisify(ec2.describeSecurityGroups).bind(ec2)
   const describeSgsResult = await describeSgs_p(sgParams)
   let sg_ids = describeSgsResult.SecurityGroups.filter(s => s.GroupName !== "default").map(i => i.GroupId)

   // delete security groups
   const deleteSg_p = promisify(ec2.deleteSecurityGroup).bind(ec2)
  let liDeleteSgPromises = sg_ids.map(iid => deleteSg_p({GroupId: iid}))
  const liDeleteSgResult = await Promise.all(liDeleteSgPromises)
  console.log("security groups deleted")
  console.log(liDeleteSgResult)

  // delete vpc
  const deleteVpc_p = promisify(ec2.deleteVpc).bind(ec2)
  const vpcParam = {
    vpc_id
  }
  const deleteVpcResult = await deleteVpc_p(vpcParam)
  console.log("vpc deleted")
  console.log(deleteVpcResult)

  return deleteVpcResult;
}

export {
  cleanupDefaultVpcs,
  createVpcWithResources,
  deleteVpc
}
