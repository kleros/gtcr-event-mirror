import { run, ethers, upgrades } from 'hardhat';

async function main() {
  await run('compile');
  const accounts = await ethers.getSigners();

  const ArbitratorFactory = await ethers.getContractFactory(
    'AutoAppealableArbitrator'
  );

  const GeneralizedTCRFactory = await ethers.getContractFactory(
    'GeneralizedTCR'
  );

  const GTCREventsMirrorFactory = await ethers.getContractFactory(
    'GTCREventsMirror'
  );

  console.info('Deploying arbitrator...');
  const arbitrator = await upgrades.deployProxy(ArbitratorFactory, [0]);
  await arbitrator.deployed();
  console.info('Arbitrator deployed to:', arbitrator.address);

  const governor = accounts[0];
  const other = accounts[3];
  const arbitratorExtraData = '0x85';

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

  console.info('Deploying GTCR...');
  const gtcr = await upgrades.deployProxy(GeneralizedTCRFactory, [
    arbitrator.address,
    arbitratorExtraData,
    other, // ConnectedTCR is not used here.
    registrationMetaEvidence,
    clearingMetaEvidence,
    governor,
    submissionBaseDeposit,
    removalBaseDeposit,
    submissionChallengeBaseDeposit,
    removalChallengeBaseDeposit,
    challengePeriodDuration,
    [sharedStakeMultiplier, winnerStakeMultiplier, loserStakeMultiplier]
  ]);
  await gtcr.deployed();
  console.info('GeneralizedTCR deployed to:', gtcr.address);

  console.info('Deploying events relay contract...');
  const GTCREventsMirror = await upgrades.deployProxy(
    GTCREventsMirrorFactory,
    []
  );
  await GTCREventsMirror.deployed();
  console.info('GTCR events relay deployed to:', GTCREventsMirror.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
