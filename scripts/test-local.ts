import { assert } from 'chai';
import delay from 'delay';
import { ethers as ethersNamespace } from 'ethers';
import { run, ethers, upgrades } from 'hardhat';
import itemStatusChangeHandler from '../bot/handlers/itemStatusChangeHandler';

/** Increases ganache time by the passed duration in seconds and mines a block.
 * @param {number} duration time in seconds
 */
async function increaseTime(
  provider: ethersNamespace.providers.JsonRpcProvider,
  duration: number
) {
  await provider.send('evm_increaseTime', [duration]);
  await provider.send('evm_mine', []);
}

async function main() {
  await run('compile');
  const accounts = await ethers.getSigners();
  const requester = accounts[1];
  const challenger = accounts[2];
  const governor = accounts[0];
  const other = accounts[3];
  const arbitratorExtraData = '0x00';

  const submissionBaseDeposit = 2000;
  const removalBaseDeposit = 1300;
  const submissionChallengeBaseDeposit = 5000;
  const removalChallengeBaseDeposit = 1200;
  const challengePeriodDuration = 600;
  const sharedStakeMultiplier = 5000;
  const winnerStakeMultiplier = 2000;
  const loserStakeMultiplier = 8000;
  const registrationMetaEvidence = 'registrationMetaEvidence.json';
  const clearingMetaEvidence = 'clearingMetaEvidence.json';

  //////////////////////
  // Setup Arbitrator //
  //////////////////////

  console.info('Deploying arbitrator...');
  const ArbitratorFactory = await ethers.getContractFactory(
    'AutoAppealableArbitrator'
  );

  const arbitrationCost = 0;
  const arbitrator = await ArbitratorFactory.deploy(arbitrationCost);
  await arbitrator.deployed();
  console.info('Arbitrator deployed to:', arbitrator.address);
  console.info('');

  //////////////////////////
  // Setup GeneralizedTCR //
  //////////////////////////

  console.info('Deploying GTCR...');
  const GeneralizedTCRFactory = await ethers.getContractFactory(
    'GeneralizedTCR'
  );
  const gtcr = await GeneralizedTCRFactory.deploy(
    arbitrator.address,
    arbitratorExtraData,
    other.address, // ConnectedTCR is not used here.
    registrationMetaEvidence,
    clearingMetaEvidence,
    governor.address,
    submissionBaseDeposit,
    removalBaseDeposit,
    submissionChallengeBaseDeposit,
    removalChallengeBaseDeposit,
    challengePeriodDuration,
    [sharedStakeMultiplier, winnerStakeMultiplier, loserStakeMultiplier]
  );
  await gtcr.deployed();
  console.info('GeneralizedTCR deployed to:', gtcr.address);
  console.info('');

  const submitterTotalCost = arbitrationCost + submissionBaseDeposit;
  gtcr.connect(requester);
  await gtcr.addItem('0xffb43c41', { value: submitterTotalCost });
  await gtcr.addItem('0xffb43c42', { value: submitterTotalCost });
  await gtcr.addItem('0xffb43c43', { value: submitterTotalCost });
  await gtcr.addItem('0xffb43c44', { value: submitterTotalCost });
  await gtcr.addItem('0xffb43c45', { value: submitterTotalCost });

  gtcr.connect(challenger);
  const submissionChallengeTotalCost =
    arbitrationCost + submissionChallengeBaseDeposit;
  await gtcr.challengeRequest(await gtcr.itemList(0), 'Evidence.json', {
    value: submissionChallengeTotalCost
  });

  await increaseTime(ethers.provider, challengePeriodDuration + 1);
  await gtcr.executeRequest(await gtcr.itemList(1));
  await gtcr.executeRequest(await gtcr.itemList(2));
  await gtcr.executeRequest(await gtcr.itemList(3));
  await gtcr.executeRequest(await gtcr.itemList(4));

  gtcr.connect(requester);
  const removalTotalCost = arbitrationCost + removalBaseDeposit;
  await gtcr.removeItem(await gtcr.itemList(2), '', {
    value: removalTotalCost
  });
  await gtcr.removeItem(await gtcr.itemList(3), '', {
    value: removalTotalCost
  });
  await gtcr.removeItem(await gtcr.itemList(4), '', {
    value: removalTotalCost
  });

  gtcr.connect(challenger);
  const removalChallengeTotalCost =
    arbitrationCost + removalChallengeBaseDeposit;
  await gtcr.challengeRequest(await gtcr.itemList(3), 'evidence', {
    value: removalChallengeTotalCost
  });
  await gtcr.challengeRequest(await gtcr.itemList(4), 'evidence', {
    value: removalChallengeTotalCost
  });

  await increaseTime(ethers.provider, challengePeriodDuration + 1);
  await gtcr.executeRequest(await gtcr.itemList(2));

  ///////////////////////////
  // Setup GTCREventMirror //
  ///////////////////////////

  console.info('Deploying events mirror contract...');
  const GTCREventsMirrorFactory = await ethers.getContractFactory(
    'GTCREventsMirror'
  );
  const gtcrEventsMirror = await upgrades.deployProxy(
    GTCREventsMirrorFactory,
    []
  );
  await gtcrEventsMirror.deployed();
  console.info('GTCR events mirror deployed to:', gtcrEventsMirror.address);
  console.info('');

  // Relay some events manually to simulate bot going offline
  // for some time.

  const firstLog = (
    await ethers.provider.getLogs({
      ...gtcr.filters.ItemStatusChange(),
      fromBlock: 0
    })
  ).map((log) => gtcr.interface.parseLog(log).args)[0];
  await gtcrEventsMirror.emitItemStatusChange(
    [firstLog._itemID],
    [firstLog._requestIndex],
    [firstLog._roundIndex],
    [firstLog._disputed],
    [firstLog._resolved],
    0
  );
  console.info('Relayed event manually');

  ///////////////////////////
  //       Start Bot       //
  ///////////////////////////

  itemStatusChangeHandler(ethers.provider, gtcr, gtcrEventsMirror, 2); // Start bot
  await delay(1000 * 6); // Wait for sync

  await arbitrator.giveRuling(0, 1);
  await arbitrator.giveRuling(1, 1);
  await arbitrator.giveRuling(2, 2);

  console.info('Rulings given');

  await delay(1000 * 5); // Wait for sync

  const watchLogsArgs = (
    await ethers.provider.getLogs({
      ...gtcr.filters.ItemStatusChange(),
      fromBlock: 0
    })
  ).map((log) => gtcr.interface.parseLog(log).args);

  const mirroredLogsArgs = (
    await ethers.provider.getLogs({
      ...gtcrEventsMirror.filters.ItemStatusChange(),
      fromBlock: 0
    })
  ).map((log) => gtcrEventsMirror.interface.parseLog(log).args);

  console.info(`Total events: ${watchLogsArgs.length}`);
  console.info(`Relayed events: ${mirroredLogsArgs.length}`);

  // Verify logs where relayed properly.
  watchLogsArgs.forEach((watchLogArgs, i) => {
    const mirroredLogArgs = mirroredLogsArgs[i];
    watchLogArgs.forEach((watchLogArg, j) => {
      assert(
        String(mirroredLogArgs[j]) === String(watchLogArg),
        `Logs args did not match: ${
          (String(mirroredLogArgs[0]), String(watchLogArg))
        }`
      );
    });
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
