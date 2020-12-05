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
        version: '0.4.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: '0.5.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: '0.7.3',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    xDai: {
      url: 'https://xdai.poanetwork.dev',
      accounts: []
    },
    sokol: {
      url: 'https://sokol.poa.network',
      accounts: []
    }
  }
};
