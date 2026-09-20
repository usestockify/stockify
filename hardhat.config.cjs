require("@nomicfoundation/hardhat-toolbox");

/** Local-only Stockify vault contracts. Never pointed at Robinhood mainnet. */
module.exports = {
  solidity: "0.8.24",
  paths: {
    sources: "./contracts/local",
    tests: "./test/contracts",
    cache: "./.data/hardhat-cache",
    artifacts: "./.data/hardhat-artifacts",
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
  },
};
