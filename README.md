<p align="center">
  <b style="font-size: 32px;">GeneralizedTCR Events Mirror</b>
</p>

<p align="center">
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="JavaScript Style Guide"></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg" alt="Conventional Commits"></a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen Friendly"></a>
</p>

This tool allows an oracle to mirror events from a Generalized TCR contract to another contract on another chain (though it can be used on the same chain).

The motivation for the development of this tool is to allow a subgraph synced to an Ethereum blockchain (say xDai) to handle changes that happen on another chain (say Mainnet). This allows for queries using data from both blockchains.

Throughout this project, we call "watch contract" the contract from which the bot reads events, and "mirror contract" the contract to which it sends transactions/relays the events.

## Prerequisites

- Tested on NodeJS version 10

## Development

1.  Clone this repo and run `yarn`.
2.  Duplicate `.env.example` and name it `.env`.
3.  Run `yarn start:localnode`. Once it finishes booting, copy the first account private key and paste it on the `MIRROR_CONTRACT_WALLET_PRIVATE_KEY` variable in .`env.`. It should be the same every time you boot your node.
4.  On another terminal, run `yarn deploy:localhost`. Copy the GeneralizedTCR address to the `WATCH_CONTRACT_ADDRESS` environment variable. Copy the GTCR events relay address to `MIRROR_CONTRACT_ADDRESS` environment variable.
5.  To run the bot we have to options see option `Option A` if are working on VS Code/Codium and `Option B` to just run the bot.

### Option A

If developing in VS Code/Codium, you can use this `.vscode/launch.json` file for debugging:

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "program": "${workspaceFolder}/bot/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

With the file in place, just hit `F5`.

### Option B

Alternatively you can just build and run the bot with `yarn start:bot`.

## Contributing

See CONTRIBUTING.md.