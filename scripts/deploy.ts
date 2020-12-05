import { run, ethers, upgrades } from 'hardhat';

async function main() {
  await run('compile');
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
