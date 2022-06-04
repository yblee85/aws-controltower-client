import AWS from 'aws-sdk';
import {promisify} from 'util';

const getRootAccountCredentials = () => {
  const credentials = new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })

  AWS.config.credentials = credentials;
  AWS.config.region = process.env.AWS_DEFAULT_REGION || "us-east-1";

  return credentials;
}

const getCrossAccountCredentials = async (target_aws_account_id) => {
  
  const rootCredentials = getRootAccountCredentials();

  // If you don't have aws control tower and want to manage resource in root account directly, 
  // uncomment below
  // return { accessKeyId: rootCredentials.AccessKeyId, secretAccessKey: rootCredentials.SecretAccessKey, sessionToken: rootCredentials.SessionToken };
  // and comment below

  const sts = new AWS.STS();
  const assumeRole_p = promisify(sts.assumeRole).bind(sts)
  
  const timestamp = (new Date()).getTime();
  const params = {
    RoleArn: `arn:aws:iam::${target_aws_account_id}:role/AWSControlTowerExecution`,
    RoleSessionName: `from-control-tower-${timestamp}`
  };
  
  const data = await assumeRole_p(params);
  
  return {
    accessKeyId: data.Credentials.AccessKeyId,
    secretAccessKey: data.Credentials.SecretAccessKey,
    sessionToken: data.Credentials.SessionToken,
  }
}

const getAWSAccountName = (customer_number) => {
  if(customer_number === undefined) {
    throw new Error("Undefined Customer Number");
  }
  const emailRootName = process.env.AWS_SUB_ACCOUNT_EMAIL_USERNAME;
  const emailSuffix = process.env.AWS_SUB_ACCOUNT_NAME_SUFFIX || "";
  const env = process.env.NODE_ENV || "";

  return `${emailRootName}+${emailSuffix}-${env}-customer-${customer_number}`;
}

export {
  getRootAccountCredentials,
  getCrossAccountCredentials,
  getAWSAccountName
};
