const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("local Stockify vault", function () {
  async function deploy() {
    const [a, b] = await ethers.getSigners();
    const Usd = await ethers.getContractFactory("MockUSDG");
    const usdg = await Usd.deploy();
    const Factory = await ethers.getContractFactory("StockifyVaultFactory");
    const factory = await Factory.deploy();
    await factory.createVault(await usdg.getAddress(), "NVDA Vault", "svNVDA");
    const vaultAddr = await factory.vaults(0);
    const vault = await ethers.getContractAt("StockifyVault", vaultAddr);
    await usdg.mint(a.address, 1_000_000_000n);
    await usdg.mint(b.address, 1_000_000_000n);
    return { a, b, usdg, factory, vault };
  }

  it("deposit mints shares", async function () {
    const { a, usdg, vault } = await deploy();
    await usdg.approve(await vault.getAddress(), 1_000_000n);
    await vault.deposit(1_000_000n, a.address);
    expect(await vault.balanceOf(a.address)).to.equal(1_000_000n * 10n ** 12n);
    expect(await vault.totalAssets()).to.equal(1_000_000n);
  });

  it("withdraw burns shares and returns assets", async function () {
    const { a, usdg, vault } = await deploy();
    await usdg.approve(await vault.getAddress(), 1_000_000n);
    await vault.deposit(1_000_000n, a.address);
    const shares = await vault.balanceOf(a.address);
    await vault.withdraw(shares, a.address);
    expect(await vault.balanceOf(a.address)).to.equal(0n);
    expect(await usdg.balanceOf(a.address)).to.equal(1_000_000_000n);
  });

  it("rounds down in favor of the vault", async function () {
    const { a, usdg, vault } = await deploy();
    await usdg.approve(await vault.getAddress(), 3n);
    await vault.deposit(3n, a.address);
    const shares = await vault.convertToShares(1n);
    expect(shares).to.equal(10n ** 12n);
  });

  it("reverts on zero deposit", async function () {
    const { a, vault } = await deploy();
    await expect(vault.deposit(0n, a.address)).to.be.revertedWith("ZERO");
  });

  it("reverts on insufficient allowance", async function () {
    const { a, vault } = await deploy();
    await expect(vault.deposit(100n, a.address)).to.be.revertedWith("ALLOWANCE");
  });

  it("supports multiple users", async function () {
    const { a, b, usdg, vault } = await deploy();
    await usdg.approve(await vault.getAddress(), 100n);
    await usdg.connect(b).approve(await vault.getAddress(), 300n);
    await vault.deposit(100n, a.address);
    await vault.connect(b).deposit(300n, b.address);
    expect(await vault.totalAssets()).to.equal(400n);
    const aShares = await vault.balanceOf(a.address);
    const bShares = await vault.balanceOf(b.address);
    expect(bShares / aShares).to.equal(3n);
  });

  it("full withdrawal empties the vault", async function () {
    const { a, b, usdg, vault } = await deploy();
    await usdg.approve(await vault.getAddress(), 50n);
    await usdg.connect(b).approve(await vault.getAddress(), 50n);
    await vault.deposit(50n, a.address);
    await vault.connect(b).deposit(50n, b.address);
    await vault.withdraw(await vault.balanceOf(a.address), a.address);
    await vault.connect(b).withdraw(await vault.balanceOf(b.address), b.address);
    expect(await vault.totalSupply()).to.equal(0n);
    expect(await vault.totalAssets()).to.equal(0n);
  });
});
