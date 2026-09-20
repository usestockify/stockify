const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

async function main() {
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  const hre = require("hardhat");
  await hre.run("compile");
  const [signer] = await hre.ethers.getSigners();
  const Usd = await hre.ethers.getContractFactory("MockUSDG");
  const usdg = await Usd.deploy();
  await usdg.mint(signer.address, 1_000_000_000_000n);
  const Factory = await hre.ethers.getContractFactory("StockifyVaultFactory");
  const factory = await Factory.deploy();
  await factory.createVault(await usdg.getAddress(), "Local NVDA Vault", "svNVDA");
  const vault = await factory.vaults(0);
  const payload = {
    chainId: 31337,
    local: true,
    MockUSDG: await usdg.getAddress(),
    VaultFactory: await factory.getAddress(),
    Vault: vault,
    warning: "LOCAL DEVELOPMENT — never deploy these to Robinhood Chain from this script",
  };
  fs.writeFileSync(path.join(dir, "local-vaults.json"), JSON.stringify(payload, null, 2));
  console.log("LOCAL DEVELOPMENT");
  console.log(JSON.stringify(payload, null, 2));
  console.log("STOCKIFY_VAULT_FACTORY=" + payload.VaultFactory);
  console.log("STOCKIFY_LOCAL_VAULTS=1");
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes("--node")) {
    const node = spawn("npx", ["hardhat", "node"], { stdio: "inherit", shell: process.platform === "win32" });
    node.on("exit", (code) => process.exit(code ?? 0));
  } else {
    main().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }
}

module.exports = { main };
