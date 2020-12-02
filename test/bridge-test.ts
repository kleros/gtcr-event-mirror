import { ethers, upgrades } from 'hardhat';

describe('Token', function () {
  it('should emit events', async function () {
    const GTCREventsMirrorFactory = await ethers.getContractFactory(
      'GTCREventsMirror'
    );
    const gtcrEventsMirror = await upgrades.deployProxy(
      GTCREventsMirrorFactory,
      [],
      { initializer: 'initialize' }
    );

    await gtcrEventsMirror.deployed();

    // TODO: test event emission.
  });
});
