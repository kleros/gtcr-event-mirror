import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@openzeppelin/hardhat-upgrades';

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    compilers: [
      {
        version: '0.4.24'
      },
      {
        version: '0.5.16'
      },
      {
        version: '0.7.3'
      }
    ]
  }
};
