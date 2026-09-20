require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true },
  },
  paths: {
    sources: "./contracts/protocol",
    tests: "./test/contracts",
    cache: "./.data/hardhat-cache",
    artifacts: "./.data/hardhat-artifacts",
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    robinhood: {
      url: process.env.RH_RPC_URL || process.env.RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
      chainId: 4663,
    },
  },
};
