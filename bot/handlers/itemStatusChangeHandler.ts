import delay from 'delay';
import { ethers } from 'ethers';

enum EventIdentifier {
  ItemStatusChange = 0
}

const itemStatusChangeHandler = async (
  watchContractProvider: ethers.providers.BaseProvider,
  gtcr: ethers.Contract,
  mirrorGtcr: ethers.Contract,
  botPeriodSeconds: number
): Promise<never> => {
  // First, we must learn up to which block of the watch contract
  // the mirror contract is synced to.
  // To do this we get all logs and count them until the number
  // of logs found match (or exceeds) the count on the mirror contract.
  let mirrorContractEventCount = Number(
    await mirrorGtcr.eventToCount(EventIdentifier.ItemStatusChange)
  );
  let syncedEventCount = 0;

  // Fetch logs in steps to avoid getting rate limited.
  const interval = {
    fromBlock: Number(process.env.WATCH_CONTRACT_DEPLOY_BLOCK),
    toBlock: Number(process.env.WATCH_CONTRACT_DEPLOY_BLOCK) + 100000
  };

  let lastRelayedBlock = 0;
  while (syncedEventCount !== mirrorContractEventCount) {
    console.info(
      ` Syncing... ${syncedEventCount}/${mirrorContractEventCount} events`
    );
    console.info(
      ` Checking blocks from ${interval.fromBlock} to ${interval.toBlock}`
    );
    const logs = await watchContractProvider.getLogs({
      ...gtcr.filters.ItemStatusChange(),
      ...interval
    });

    syncedEventCount += logs.length;
    if (syncedEventCount >= mirrorContractEventCount) {
      // Remove logs that were not relayed yet.
      const relayedLogs = logs.slice(
        0,
        mirrorContractEventCount - syncedEventCount
      );

      // Take the block from the last relayed event.
      let lastRelayedLog: ethers.providers.Log;
      if (relayedLogs.length === 0) {
        lastRelayedLog = logs[logs.length - 1];
      } else {
        lastRelayedLog = relayedLogs[relayedLogs.length - 1];
      }

      // Remove pending logs.
      syncedEventCount = mirrorContractEventCount;
      lastRelayedBlock = lastRelayedLog.blockNumber;
      break;
    }

    interval.fromBlock = interval.toBlock + 1;
    interval.toBlock = interval.fromBlock + 100000;
  }
  console.info(`Bot synced. ${syncedEventCount}/${mirrorContractEventCount}`);
  console.info('');

  if (mirrorContractEventCount === 0) {
    interval.fromBlock = Number(process.env.WATCH_CONTRACT_DEPLOY_BLOCK);
    interval.toBlock = Number(process.env.WATCH_CONTRACT_DEPLOY_BLOCK) + 100000;
  } else {
    interval.fromBlock = lastRelayedBlock + 1;
  }

  console.info('Starting to relay events');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const blockHeight = await watchContractProvider.getBlockNumber();
    interval.toBlock =
      interval.fromBlock + 100000 > blockHeight
        ? blockHeight
        : interval.fromBlock + 100000;

    const logs = (
      await watchContractProvider.getLogs({
        ...gtcr.filters.ItemStatusChange(),
        ...interval
      })
    ).map((log) => gtcr.interface.parseLog(log));

    let itemIDs = logs.map(({ args }) => args._itemID);
    let requestIndexes = logs.map(({ args }) => args._requestIndex);
    let roundIndexes = logs.map(({ args }) => args._roundIndex);
    let disputesCreated = logs.map(({ args }) => args._disputed);
    let requestsResolved = logs.map(({ args }) => args._resolved);

    if (logs.length > 0) {
      console.info(
        ` Got ${logs.length} events between blocks ${interval.fromBlock} and ${interval.toBlock}`
      );

      const numberOfBatches = Math.ceil(logs.length / 10);
      for (let i = 0; i < numberOfBatches; i++) {
        const numItemsToSubmit = itemIDs.length >= 10 ? 10 : itemIDs.length;
        mirrorContractEventCount = Number(
          await mirrorGtcr.eventToCount(EventIdentifier.ItemStatusChange)
        );

        console.info(
          `  Emitting ${numItemsToSubmit} events starting at ${mirrorContractEventCount}`
        );
        await mirrorGtcr.emitItemStatusChange(
          itemIDs.slice(0, numItemsToSubmit),
          requestIndexes.slice(0, numItemsToSubmit),
          roundIndexes.slice(0, numItemsToSubmit),
          disputesCreated.slice(0, numItemsToSubmit),
          requestsResolved.slice(0, numItemsToSubmit),
          mirrorContractEventCount
        );

        // Remove relayed txes.
        itemIDs = itemIDs.slice(numItemsToSubmit);
        requestIndexes = requestIndexes.slice(numItemsToSubmit);
        roundIndexes = roundIndexes.slice(numItemsToSubmit);
        disputesCreated = disputesCreated.slice(numItemsToSubmit);
        requestsResolved = requestsResolved.slice(numItemsToSubmit);

        // Delay to allow more confirmations.
        await delay(botPeriodSeconds * 1000);
      }
    }

    interval.fromBlock = interval.toBlock + 1;
    await delay(botPeriodSeconds * 1000);
  }
};

export default itemStatusChangeHandler;
