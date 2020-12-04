import { ethers } from 'ethers';
import delay from 'delay';
import dotenvSafe from 'dotenv-safe';

import { abi as _GeneralizedTCR } from '@kleros/tcr/build/contracts/GeneralizedTCR.json';
import { abi as _GTCREventsMirror } from '../artifacts/contracts/GTCREventsMirror.sol/GTCREventsMirror.json';

dotenvSafe.config();

// Note, throughout the project, we refer to "watch contract", the blockchain
const mainnet: ethers.providers.Network = {
  name: process.env.WATCH_CONTRACT_CHAIN_NAME,
  chainId: Number(process.env.WATCH_CONTRACT_CHAIN_ID),
  ensAddress: process.env.WATCH_CONTRACT_ENS_ADDRESS
};
enum EventIdentifier {
  ItemStatusChange = 0
}
const eventIdentifierToEventName = {
  [EventIdentifier.ItemStatusChange]: 'ItemStatusChange'
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

const eventRelayer = async (eventIdentifier: EventIdentifier) => {
  // First, we must learn up to which block of the watch contract
  // the mirror contract is synced to.
  // To do this we get all logs and count them until the number
  // of logs found match (or exceeds) the count on the mirror contract.
  let mirrorContractEventCount = Number(
    await mirrorGtcr.eventToCount(eventIdentifier)
  );
  let syncedEventCount = 0;

  // Fetch logs in steps to avoid getting rate limited.
  const interval = {
    fromBlock: 0,
    toBlock: 100000
  };

  let lastRelayedBlock = 0;
  while (syncedEventCount !== mirrorContractEventCount) {
    let logs = await watchContractProvider.getLogs({
      ...gtcr.filters[eventIdentifierToEventName[eventIdentifier]](),
      ...interval
    });

    interval.fromBlock = interval.toBlock + 1;
    interval.toBlock = interval.fromBlock + 100000;
    syncedEventCount += logs.length;
    if (syncedEventCount >= mirrorContractEventCount) {
      // Remove logs that were not relayed yet.
      logs = logs.slice(0, mirrorContractEventCount - syncedEventCount - 1);

      // Take the block from the last relayed block.
      const lastRelayedLog = logs[logs.length - 1];
      lastRelayedBlock = lastRelayedLog.blockNumber;

      // Remove pending logs.
      syncedEventCount = mirrorContractEventCount;
    }
  }

  // Relay pending events.
  interval.fromBlock = lastRelayedBlock + 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const blockHeight = await watchContractProvider.getBlockNumber();
    interval.toBlock =
      interval.fromBlock + 100000 > blockHeight
        ? blockHeight
        : interval.fromBlock + 100000;

    const logs = (
      await watchContractProvider.getLogs({
        ...gtcr.filters[eventIdentifierToEventName[eventIdentifier]](),
        ...interval
      })
    ).map((log) => gtcr.interface.parseLog(log));

    let itemIDs = logs.map(({ args }) => args[0]);
    let requestIndexes = logs.map(({ args }) => args[1]);
    let roundIndexes = logs.map(({ args }) => args[2]);
    let disputesCreated = logs.map(({ args }) => args[3]);
    let requestsResolved = logs.map(({ args }) => args[4]);

    if (logs.length >= 10) {
      // Relay in batches of at most 10 logs to avoid hitting gas limits.
      const numberOfBatches = Math.ceil(logs.length / 10);
      for (let i = 0; i < numberOfBatches; i++) {
        mirrorContractEventCount = Number(
          await mirrorGtcr.eventToCount(eventIdentifier)
        );
        await mirrorGtcr.emitItemStatusChange(
          itemIDs.slice(i + 10),
          requestIndexes.slice(i + 10),
          roundIndexes.slice(i + 10),
          disputesCreated.slice(i + 10),
          requestsResolved.slice(i + 10),
          mirrorContractEventCount
        );

        // Remove relayed txes.
        itemIDs = itemIDs.slice(-10);
        requestIndexes = requestIndexes.slice(-10);
        roundIndexes = roundIndexes.slice(-10);
        disputesCreated = disputesCreated.slice(-10);
        requestsResolved = requestsResolved.slice(-10);
      }
    } else if (logs.length > 0) {
      mirrorContractEventCount = Number(
        await mirrorGtcr.eventToCount(eventIdentifier)
      );
      await mirrorGtcr.emitItemStatusChange(
        itemIDs,
        requestIndexes,
        roundIndexes,
        disputesCreated,
        requestsResolved,
        mirrorContractEventCount
      );
    }

    interval.fromBlock = interval.toBlock + 1;
    await delay(1000 * 3 * 60); // Check for new events every 3 minutes.
  }
};

// Run bot(s).
(async () => {
  await eventRelayer(EventIdentifier.ItemStatusChange);
})();
