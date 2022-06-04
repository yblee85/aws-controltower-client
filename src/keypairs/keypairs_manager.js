import AWS from 'aws-sdk';
import { getCrossAccountCredentials } from '../utils/helper';
import {promisify} from 'util';

const importKeyPair = async (target_account_id, keypair_name, keypair_pub_key_path) => {
  // Get the Cross account credentials
  const accessparams = await getCrossAccountCredentials(target_account_id);

  let ec2 = new AWS.EC2({ apiVersion: '2016-11-15', ...accessparams });

  const keypairPublicKeyData = fs.readFileSync(keypair_pub_key_path, {encoding:'utf8', flag:'r'});

  const importKeyPair_p = promisify(ec2.importKeyPair).bind(ec2)
  const keypairParam = {
    KeyName : keypair_name,
    PublicKeyMaterial : keypairPublicKeyData
  }
  const createKeyPairResult = await importKeyPair_p(keypairParam)
  console.log(createKeyPairResult)
  console.log("key created")  // key-xxxxxxxx

  return createKeyPairResult;
}

export {
  importKeyPair
}
