# aws-controltower-client

aws resource (account, vpc, ec2) manage client library using aws javascript sdk
aws control tower is a feature you can manage other aws accounts [AWS Control Tower Overview](https://aws.amazon.com/controltower)
This is just a basic resource management library you can provision sub account -> a vpc with one subnet -> an ec2 with public ip

## pre-requisite

- aws account (root account)
- aws control tower : when you create a sub aws account, it will be registered under this control tower (root account)
- aws access keys : for this app to access all these accounts and account resources
- when you create aws contol tower, you can easily find most of information in .env except one `AWS_ACCOUNT_FACTORY_PRODUCT_PATH_ID`
  for this, you will need to call `getServiceCatalogProductLaunchPaths` from `account_manager.js`, result will give you path id.

## Manage aws resources without AWS Control Tower

If you don't need aws control tower and want to manage resource directly in root aws account, change some code in `getCrossAccountCredentials` in `utils/helper.js`

## What AWS resources this creates?

1. creates a sub aws account
   a. it may take an hour or so, use `getProvisionedProduct` and wait until its status becomes `AVAILABLE`
   b. once it's AVAILABLE, you will notice it has a default vpc in all regions, you can use `cleanupDefaultVpcs` to delete them
2. creates a vpc with specific cidrblock (ex. 10.0.0.0/24) in a region
3. in that vpc, it creates one subnet and one internet gateway
4. creates few security groups a. allow http, https b. allow from specific IP (such as your computer) for ssh
5. import ssh key for your computer to access a ec2
6. creates an ec2 with a public IP

## getting started

1. copy `.env.example` file and create a env file `.env`
2. fill up `.env` accordingly ( You can find some of env valriables info in AWS Service Catalog )
3. generate ssh key (ed25519 recommended) pair (private, public) in ssh folder (in this project)
4. feel free to take a look sample code `sample/sample.js`
