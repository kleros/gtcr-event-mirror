import 'typescript';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Production provider keys.
      ETHERSCAN_KEY: string;
      INFURA_KEY: string;
      ALCHEMY_KEY: string;

      // Production network settings
      WATCH_CONTRACT_CHAIN_NAME: string;
      WATCH_CONTRACT_CHAIN_ID: string;
      WATCH_CONTRACT_ENS_ADDRESS: string;

      // Providers.
      WATCH_CONTRACT_PROVIDER_URL: string;
      MIRROR_CONTRACT_PROVIDER_URL: string;

      // Relay wallet.
      MIRROR_CONTRACT_WALLET_PRIVATE_KEY: string;

      // Contract Addresses.
      WATCH_CONTRACT_ADDRESS: string;
      MIRROR_CONTRACT_ADDRESS: string;

      // App environment.
      NODE_ENV: string;
    }
  }
}
