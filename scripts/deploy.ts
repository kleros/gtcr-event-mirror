import { run, ethers, upgrades } from 'hardhat';

async function main() {
  await run('compile');

  const GTCREventsMirrorFactory = await ethers.getContractFactory(
    'GTCREventsMirror'
  );

  console.info('Deploying events bridge contract...');
  const GTCREventsMirror = await upgrades.deployProxy(
    GTCREventsMirrorFactory,
    [],
    { initializer: 'initialize' }
  );
  await GTCREventsMirror.deployed();
  console.info('GTCR events bridge deployed to:', GTCREventsMirror.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
