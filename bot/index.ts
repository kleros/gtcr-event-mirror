import dotenvSafe from 'dotenv-safe';
import { ethers } from 'ethers';
import { abi as _GeneralizedTCR } from '@kleros/tcr/build/contracts/GeneralizedTCR.json';

import { abi as _GTCREventsMirror } from '../artifacts/contracts/GTCREventsMirror.sol/GTCREventsMirror.json';
import itemStatusChangeHandler from './handlers/itemStatusChangeHandler';

dotenvSafe.config();

// Note, throughout the project, we refer to "watch contract", the contract
// that the bot watches for events, and "mirror contract" the contract to
// which it relays events.
const mainnet: ethers.providers.Network = {
  name: process.env.WATCH_CONTRACT_CHAIN_NAME,
  chainId: Number(process.env.WATCH_CONTRACT_CHAIN_ID),
  ensAddress: process.env.WATCH_CONTRACT_ENS_ADDRESS
};

const watchContractProvider =
  process.env.NODE_ENV === 'PROD'
    ? ethers.getDefaultProvider(mainnet, {
        etherscan: process.env.ETHERSCAN_KEY,
        infura: process.env.INFURA_KEY,
        alchemy: process.env.ALCHEMY_KEY
      })
    : new ethers.providers.JsonRpcProvider(
        process.env.WATCH_CONTRACT_PROVIDER_URL
      );

const mirrorContractProvider = new ethers.providers.JsonRpcProvider(
  process.env.MIRROR_CONTRACT_PROVIDER_URL
);
const mirrorContractSigner = new ethers.Wallet(
  process.env.MIRROR_CONTRACT_WALLET_PRIVATE_KEY,
  mirrorContractProvider
);

const gtcr = new ethers.Contract(
  process.env.WATCH_CONTRACT_ADDRESS,
  _GeneralizedTCR,
  watchContractProvider
);

const mirrorGtcr = new ethers.Contract(
  process.env.MIRROR_CONTRACT_ADDRESS,
  _GTCREventsMirror,
  mirrorContractSigner
);

console.info('Starting ItemStatusChange event handler...');
console.info(`Selected period duration: ${process.env.BOT_PERIOD_SECONDS}s `);
itemStatusChangeHandler(
  watchContractProvider,
  gtcr,
  mirrorGtcr,
  Number(process.env.BOT_PERIOD_SECONDS)
);
