const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("local idle vault (legacy helper)", function () {
  it("mock token mints", async function () {
    const Token = await ethers.getContractFactory("MockERC20");
    const t = await Token.deploy("Mock USDG", "USDG", 6);
    const [a] = await ethers.getSigners();
    await t.mint(a.address, 1000);
    expect(await t.balanceOf(a.address)).to.equal(1000);
  });
});
