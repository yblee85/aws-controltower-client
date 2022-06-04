// import entire SDK
import AWS from 'aws-sdk';
import { getRootAccountCredentials, getAWSAccountName } from '../utils/helper';
import {promisify} from 'util';

const credentials = getRootAccountCredentials();

const provisionAccount = async (customer_number) => {
  const servicecatalog = new AWS.ServiceCatalog({apiVersion: '2015-12-10'});
  const provisionAccount_p = promisify(servicecatalog.provisionProduct).bind(servicecatalog);
  
  const customerName = getAWSAccountName(customer_number);
  const params = {
    ProvisionedProductName: `${customerName}`, /* required */
    AcceptLanguage: 'en',
    NotificationArns: [
    ],
    PathId: process.env.AWS_ACCOUNT_FACTORY_PRODUCT_PATH_ID,
    ProductId: process.env.AWS_ACCOUNT_FACTORY_PRODUCT_ID,                  
    ProvisioningArtifactId: process.env.AWS_ACCOUNT_FACTORY_PROVISIONING_ARTIFACT_Id,       
    ProvisioningParameters: [
      {
        Key: 'AccountName',
        Value: `${customerName}`
      },
      {
        Key: 'AccountEmail',
        Value: `${customerName}@${AWS_SUB_ACCOUNT_EMAIL_DOMAIN}`
      },
      {
        Key: 'SSOUserFirstName',
        Value: `${customerName}`
      },
      {
        Key: 'SSOUserLastName',
        Value: `Account`
      },
      {
        Key: 'SSOUserEmail',
        Value: `${customerName}@${AWS_SUB_ACCOUNT_EMAIL_DOMAIN}`
      },
      {
        Key: 'ManagedOrganizationalUnit',
        Value: process.env.AWS_ACCOUNT_FACTORY_CUSTOMER_OU_NAME
      },
    ],
    ProvisioningPreferences: {
    },
    Tags: [
    ]
  };

  return await provisionAccount_p(params);
  // {
  //   RecordDetail: {
  //     RecordId: 'rec-xxxxxx',
  //     ProvisionedProductName: 'sample+ct-test-dev-customer-1',
  //     Status: 'CREATED',
  //     CreatedTime: 2022-05-03T15:44:09.223Z,
  //     UpdatedTime: 2022-05-03T15:44:09.223Z,
  //     ProvisionedProductType: 'CONTROL_TOWER_ACCOUNT',
  //     RecordType: 'PROVISION_PRODUCT',
  //     ProvisionedProductId: 'pp-xxxxxx',
  //     ProductId: 'prod-xxxxxx',
  //     ProvisioningArtifactId: 'pa-xxxxxx',
  //     PathId: 'lpv2-xxxxxx',
  //     RecordErrors: [],
  //     RecordTags: []
  //   }
  // }
};

const getServiceCatalogProductLaunchPaths = async (service_catalog_product_id) => {
  const servicecatalog = new AWS.ServiceCatalog({apiVersion: '2015-12-10'});
  const listLaunchPaths_p = promisify(servicecatalog.listLaunchPaths).bind(servicecatalog);

  const params = {
    AcceptLanguage: 'en',
    ProductId: service_catalog_product_id,
  };

  return await listLaunchPaths_p(params);
  // {
  //   LaunchPathSummaries: [
  //     {
  //       Id: 'lpv2-xxxxxx',
  //       ConstraintSummaries: [],
  //       Tags: [],
  //       Name: 'AWS Control Tower Account Factory Portfolio'
  //     }
  //   ]
  // }
}

const getProvisionedProductOutputs = async (provisioned_product_name) => {
  const servicecatalog = new AWS.ServiceCatalog({apiVersion: '2015-12-10'});
  const getProvisionedProductOutputs_p = promisify(servicecatalog.getProvisionedProductOutputs).bind(servicecatalog);

  const params = {
    AcceptLanguage: 'en',
    ProvisionedProductName: provisioned_product_name,
  };

  return await getProvisionedProductOutputs_p(params);
  // {
  //   Outputs: [
  //     {
  //       OutputKey: 'AccountId',
  //       OutputValue: '1111111111111',
  //       Description: 'Managed Account Id'
  //     },
  //     {
  //       OutputKey: 'SSOUserEmail',
  //       OutputValue: 'sample+ct-test-customer-1@email.com',
  //       Description: 'SSO User email associated with the Account.'
  //     },
  //     {
  //       OutputKey: 'AccountEmail',
  //       OutputValue: 'sample+ct-test-customer-1@email.com',
  //       Description: 'Email Id associated with the Account'
  //     },
  //     {
  //       OutputKey: 'SSOUserPortal',
  //       OutputValue: 'https://a-234jhg34khj2.awsapps.com/start',
  //       Description: 'SSO User Portal to federate into the managed Account.'
  //     }
  //   ]
  // }

}

const getProvisionedProduct = async (provisioned_product_name) => {
  const servicecatalog = new AWS.ServiceCatalog({apiVersion: '2015-12-10'});
  const describeProvisionedProduct_p = promisify(servicecatalog.describeProvisionedProduct).bind(servicecatalog);

  const params = {
    AcceptLanguage: 'en',
    Name: provisioned_product_name,
  };

  return await describeProvisionedProduct_p(params);
  // {
  //   ProvisionedProductDetail: {
  //     Name: 'sample+ct-test-customer-1',
  //     Arn: 'arn:aws:servicecatalog:us-east-1:2342424324234:stack/sample+ct-test-customer-1/pp-xxxxxxxx',
  //     Type: 'CONTROL_TOWER_ACCOUNT',
  //     Id: 'pp-xxxxxxxx',
  //     Status: 'UNDER_CHANGE',
  //     CreatedTime: 2022-05-03T15:44:09.223Z,
  //     IdempotencyToken: 'xxxxxxx-xxxxx-xxxx-xxxx-xxxxx',
  //     LastRecordId: 'rec-xxxxxxx',
  //     LastProvisioningRecordId: 'rec-xxxxxx',
  //     ProductId: 'prod-xxxxxxxx',
  //     ProvisioningArtifactId: 'pa-xxxxxxx'
  //   },
  //   CloudWatchDashboards: []
  // }

  // Status : 
  // "AVAILABLE"
  // "UNDER_CHANGE"
  // "TAINTED"
  // "ERROR"
  // "PLAN_IN_PROGRESS"
}

export {
  provisionAccount,
  getServiceCatalogProductLaunchPaths,
  getProvisionedProductOutputs,
  getProvisionedProduct
};
