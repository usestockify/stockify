// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockUSDG {
    string public name = "Mock USDG";
    string public symbol = "USDG";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "ALLOWANCE");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "BALANCE");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

contract LocalIdleVault {
    MockUSDG public immutable asset;
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    uint256 public totalAssets;
    mapping(address => uint256) public balanceOf;

    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);

    constructor(MockUSDG asset_, string memory name_, string memory symbol_) {
        asset = asset_;
        name = name_;
        symbol = symbol_;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        if (totalSupply == 0 || totalAssets == 0) return assets * 1e12;
        return (assets * totalSupply) / totalAssets;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        if (totalSupply == 0) return 0;
        return (shares * totalAssets) / totalSupply;
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        require(assets > 0, "ZERO");
        shares = convertToShares(assets);
        require(shares > 0, "SHARES");
        require(asset.transferFrom(msg.sender, address(this), assets), "TRANSFER");
        totalAssets += assets;
        totalSupply += shares;
        balanceOf[receiver] += shares;
        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function withdraw(uint256 shares, address receiver) external returns (uint256 assets) {
        require(shares > 0, "ZERO");
        require(balanceOf[msg.sender] >= shares, "SHARES");
        assets = convertToAssets(shares);
        balanceOf[msg.sender] -= shares;
        totalSupply -= shares;
        totalAssets -= assets;
        require(asset.transfer(receiver, assets), "TRANSFER");
        emit Withdraw(msg.sender, receiver, msg.sender, assets, shares);
    }
}

contract LocalIdleVaultFactory {
    address[] public vaults;
    event VaultCreated(address indexed vault, address indexed asset, string name);

    function vaultCount() external view returns (uint256) {
        return vaults.length;
    }

    function createVault(MockUSDG asset, string calldata name_, string calldata symbol_) external returns (address vault) {
        LocalIdleVault deployed = new LocalIdleVault(asset, name_, symbol_);
        vault = address(deployed);
        vaults.push(vault);
        emit VaultCreated(vault, address(asset), name_);
    }
}
