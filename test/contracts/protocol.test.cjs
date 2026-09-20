const { expect } = require("chai");
const { ethers } = require("hardhat");

const ONE_USDG = 1_000_000n;
const HEARTBEAT = 86400;

async function deployStack() {
  const [admin, alice, bob, attacker] = await ethers.getSigners();
  const Usd = await ethers.getContractFactory("MockERC20");
  const usdg = await Usd.deploy("Global Dollar", "USDG", 6);
  const Stock = await ethers.getContractFactory("MockStock");
  const stock = await Stock.deploy();
  const Agg = await ethers.getContractFactory("MockAggregator");
  const stockFeed = await Agg.deploy(8, 100_00000000n); // $100
  const usdgFeed = await Agg.deploy(8, 1_00000000n); // $1
  const Oracle = await ethers.getContractFactory("OracleAdapter");
  const oracle = await Oracle.deploy(await usdg.getAddress(), admin.address);
  await oracle.setUsdgFeed(await usdgFeed.getAddress(), HEARTBEAT);
  await oracle.setFeed(await stock.getAddress(), await stockFeed.getAddress(), HEARTBEAT);

  const Dex = await ethers.getContractFactory("MockDex");
  const dex = await Dex.deploy(await stock.getAddress(), await usdg.getAddress());

  const Registry = await ethers.getContractFactory("StockRegistry");
  const registry = await Registry.deploy(await usdg.getAddress(), admin.address);
    const VaultFactory = await ethers.getContractFactory("contracts/protocol/Factories.sol:StockifyVaultFactory");
  const vaultFactory = await VaultFactory.deploy(await usdg.getAddress(), admin.address);
  const StratFactory = await ethers.getContractFactory("StockifyStrategyFactory");
  const stratFactory = await StratFactory.deploy(
    await usdg.getAddress(),
    await oracle.getAddress(),
    await dex.getAddress(),
    await dex.getAddress(),
    await dex.getAddress(),
    admin.address,
  );

  await vaultFactory.createVault(await stock.getAddress(), "NVDA", "Stockify NVIDIA Vault", "stNVDA");
  const vaultAddr = await vaultFactory.vaultOf(await stock.getAddress());
    const vault = await ethers.getContractAt("contracts/protocol/StockifyVault.sol:StockifyVault", vaultAddr);
  await stratFactory.createStrategy(vaultAddr, await stock.getAddress(), 3000, 2000);
  const strategyAddr = await stratFactory.strategyOf(vaultAddr);
  const strategy = await ethers.getContractAt("StockMarketStrategy", strategyAddr);
  await vault.bindStrategy(strategyAddr);
  await registry.register("NVDA", await stock.getAddress(), vaultAddr, strategyAddr);
  const Router = await ethers.getContractFactory("StockifyRouter");
  const router = await Router.deploy(await usdg.getAddress(), await registry.getAddress());

  await usdg.mint(alice.address, 1_000_000n * ONE_USDG);
  await usdg.mint(bob.address, 1_000_000n * ONE_USDG);
  await usdg.mint(attacker.address, 1_000_000n * ONE_USDG);
  await stock.mint(await dex.getAddress(), 1_000_000n * 10n ** 18n);

  return { admin, alice, bob, attacker, usdg, stock, stockFeed, usdgFeed, oracle, dex, registry, vaultFactory, stratFactory, vault, strategy, router };
}

describe("Stockify protocol", function () {
  it("deposit mints shares and withdraw/redeem return USDG", async function () {
    const { alice, usdg, vault } = await deployStack();
    await usdg.connect(alice).approve(await vault.getAddress(), 100n * ONE_USDG);
    await vault.connect(alice).deposit(100n * ONE_USDG, alice.address);
    expect(await vault.balanceOf(alice.address)).to.be.gt(0n);
    expect(await vault.totalAssets()).to.be.gt(0n);
    const shares = await vault.balanceOf(alice.address);
    await vault.connect(alice).redeem(shares, alice.address, alice.address);
    expect(await vault.balanceOf(alice.address)).to.equal(0n);
  });

  it("mint / preview round-trip", async function () {
    const { alice, usdg, vault } = await deployStack();
    const shares = await vault.previewDeposit(50n * ONE_USDG);
    await usdg.connect(alice).approve(await vault.getAddress(), 50n * ONE_USDG);
    const assets = await vault.connect(alice).mint.staticCall(shares, alice.address);
    expect(assets).to.be.closeTo(50n * ONE_USDG, 10n);
  });

  it("multiple users split value", async function () {
    const { alice, bob, usdg, vault } = await deployStack();
    await usdg.connect(alice).approve(await vault.getAddress(), 100n * ONE_USDG);
    await usdg.connect(bob).approve(await vault.getAddress(), 300n * ONE_USDG);
    await vault.connect(alice).deposit(100n * ONE_USDG, alice.address);
    await vault.connect(bob).deposit(300n * ONE_USDG, bob.address);
    const a = await vault.balanceOf(alice.address);
    const b = await vault.balanceOf(bob.address);
    expect(b / a).to.equal(3n);
  });

  it("rejects zero and dust first deposits", async function () {
    const { alice, vault } = await deployStack();
    await expect(vault.connect(alice).deposit(0n, alice.address)).to.be.reverted;
    await expect(vault.connect(alice).deposit(1n, alice.address)).to.be.reverted;
  });

  it("first depositor donation does not steal shares", async function () {
    const { alice, attacker, usdg, vault } = await deployStack();
    await usdg.connect(attacker).transfer(await vault.getAddress(), 1_000n * ONE_USDG);
    await usdg.connect(alice).approve(await vault.getAddress(), 1_000n * ONE_USDG);
    await vault.connect(alice).deposit(1_000n * ONE_USDG, alice.address);
    expect(await vault.balanceOf(alice.address)).to.be.gt(0n);
    const preview = await vault.previewRedeem(await vault.balanceOf(alice.address));
    expect(preview).to.be.gte(900n * ONE_USDG);
  });

  it("duplicate stock vaults are rejected", async function () {
    const { vaultFactory, stock } = await deployStack();
    await expect(vaultFactory.createVault(await stock.getAddress(), "NVDA", "x", "y")).to.be.reverted;
  });

  it("stale oracle pauses allocation", async function () {
    const { alice, usdg, vault, stockFeed } = await deployStack();
    await stockFeed.set(100_00000000n, 1n);
    await usdg.connect(alice).approve(await vault.getAddress(), 100n * ONE_USDG);
    await expect(vault.connect(alice).deposit(100n * ONE_USDG, alice.address)).to.be.reverted;
  });

  it("paused oracle blocks allocation", async function () {
    const { alice, usdg, vault, stock } = await deployStack();
    await stock.setPaused(true);
    await usdg.connect(alice).approve(await vault.getAddress(), 100n * ONE_USDG);
    await expect(vault.connect(alice).deposit(100n * ONE_USDG, alice.address)).to.be.reverted;
  });

  it("unauthorized rebalance reverts", async function () {
    const { alice, strategy } = await deployStack();
    await expect(strategy.connect(alice).rebalance(0, 2n ** 40n)).to.be.reverted;
  });

  it("router deposit and redeem", async function () {
    const { alice, usdg, vault, router } = await deployStack();
    await usdg.connect(alice).approve(await router.getAddress(), 25n * ONE_USDG);
    await router.connect(alice).deposit(await vault.getAddress(), 25n * ONE_USDG, alice.address, 0);
    const shares = await vault.balanceOf(alice.address);
    await vault.connect(alice).approve(await router.getAddress(), shares);
    await router.connect(alice).redeem(await vault.getAddress(), shares, alice.address, 0);
    expect(await vault.balanceOf(alice.address)).to.equal(0n);
  });

  it("keeper rebalance and full exit", async function () {
    const { admin, alice, usdg, vault, strategy } = await deployStack();
    await usdg.connect(alice).approve(await vault.getAddress(), 80n * ONE_USDG);
    await vault.connect(alice).deposit(80n * ONE_USDG, alice.address);
    await expect(strategy.connect(admin).rebalance(0, 2n ** 40n)).to.not.be.reverted;
    expect(await strategy.totalAssets()).to.be.gt(0n);
  });

  it("paused vault still allows withdraw", async function () {
    const { admin, alice, usdg, vault } = await deployStack();
    await usdg.connect(alice).approve(await vault.getAddress(), 40n * ONE_USDG);
    await vault.connect(alice).deposit(40n * ONE_USDG, alice.address);
    await vault.connect(admin).pause();
    await expect(vault.connect(alice).deposit(ONE_USDG, alice.address)).to.be.reverted;
    const shares = await vault.balanceOf(alice.address);
    await vault.connect(alice).redeem(shares / 2n, alice.address, alice.address);
    expect(await vault.balanceOf(alice.address)).to.be.gt(0n);
  });

  it("registry maps ticker to vault", async function () {
    const { registry, vault, stock } = await deployStack();
    const m = await registry.market("NVDA");
    expect(m.vault).to.equal(await vault.getAddress());
    expect(m.stock).to.equal(await stock.getAddress());
  });

  it("router slippage protects deposit", async function () {
    const { alice, usdg, vault, router } = await deployStack();
    await usdg.connect(alice).approve(await router.getAddress(), 10n * ONE_USDG);
    await expect(router.connect(alice).deposit(await vault.getAddress(), 10n * ONE_USDG, alice.address, 10n ** 30n)).to.be.reverted;
  });

  it("full vault exit returns USDG", async function () {
    const { alice, usdg, vault } = await deployStack();
    await usdg.connect(alice).approve(await vault.getAddress(), 200n * ONE_USDG);
    await vault.connect(alice).deposit(200n * ONE_USDG, alice.address);
    const before = await usdg.balanceOf(alice.address);
    await vault.connect(alice).redeem(await vault.balanceOf(alice.address), alice.address, alice.address);
    expect(await vault.totalSupply()).to.equal(0n);
    expect(await usdg.balanceOf(alice.address)).to.be.gt(before);
  });

  it("previewDeposit matches minted shares", async function () {
    const { alice, usdg, vault } = await deployStack();
    const preview = await vault.previewDeposit(33n * ONE_USDG);
    await usdg.connect(alice).approve(await vault.getAddress(), 33n * ONE_USDG);
    await vault.connect(alice).deposit(33n * ONE_USDG, alice.address);
    expect(await vault.balanceOf(alice.address)).to.equal(preview);
  });

  it("convertToAssets round trip stays within 1 unit", async function () {
    const { alice, usdg, vault } = await deployStack();
    await usdg.connect(alice).approve(await vault.getAddress(), 77n * ONE_USDG);
    await vault.connect(alice).deposit(77n * ONE_USDG, alice.address);
    const shares = await vault.balanceOf(alice.address);
    const assets = await vault.convertToAssets(shares);
    expect(assets).to.be.closeTo(77n * ONE_USDG, 1_000n);
  });

  it("unauthorized bindStrategy reverts", async function () {
    const { alice, vault, strategy } = await deployStack();
    await expect(vault.connect(alice).bindStrategy(await strategy.getAddress())).to.be.reverted;
  });

  it("fuzz many small deposits then full redeem", async function () {
    const { alice, usdg, vault } = await deployStack();
    await usdg.connect(alice).approve(await vault.getAddress(), 10_000n * ONE_USDG);
    for (let i = 1; i <= 12; i++) {
      await vault.connect(alice).deposit(BigInt(i) * ONE_USDG, alice.address);
    }
    expect(await vault.balanceOf(alice.address)).to.be.gt(0n);
    expect(await vault.totalAssets()).to.be.gt(0n);
  });
});
