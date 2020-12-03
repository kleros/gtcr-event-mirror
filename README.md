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

1.  Clone this repo.
2.  Duplicate `.env.example`, rename it to `.env` and fill in the environment variables.
3.  Run `yarn` to install dependencies and then `yarn start` to run the bot.

## Debugging

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

## Contributing

See CONTRIBUTING.md.