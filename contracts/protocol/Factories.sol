// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {StockifyVault} from "./StockifyVault.sol";
import {StockMarketStrategy} from "./StockMarketStrategy.sol";

contract StockifyVaultFactory is Ownable {
    address public immutable usdg;
    mapping(address => address) public vaultOf;
    address[] public allVaults;

    event VaultCreated(address indexed stock, address indexed vault, string ticker);

    error Duplicate();
    error ZeroAddress();

    constructor(address usdg_, address owner_) Ownable(owner_) {
        if (usdg_ == address(0)) revert ZeroAddress();
        usdg = usdg_;
    }

    function createVault(address stock, string calldata ticker, string calldata name_, string calldata symbol_)
        external
        onlyOwner
        returns (address vault)
    {
        if (stock == address(0)) revert ZeroAddress();
        if (vaultOf[stock] != address(0)) revert Duplicate();
        StockifyVault deployed = new StockifyVault(IERC20(usdg), stock, ticker, name_, symbol_, owner());
        vault = address(deployed);
        vaultOf[stock] = vault;
        allVaults.push(vault);
        emit VaultCreated(stock, vault, ticker);
    }

    function vaultCount() external view returns (uint256) {
        return allVaults.length;
    }
}

contract StockifyStrategyFactory is Ownable {
    address public immutable usdg;
    address public immutable oracle;
    address public immutable v3Factory;
    address public immutable npm;
    address public immutable swapRouter;
    mapping(address => address) public strategyOf;
    address[] public allStrategies;

    event StrategyDeployed(address indexed vault, address indexed stock, address indexed strategy, address pool);

    error Duplicate();
    error ZeroAddress();

    constructor(
        address usdg_,
        address oracle_,
        address v3Factory_,
        address npm_,
        address swapRouter_,
        address owner_
    ) Ownable(owner_) {
        if (usdg_ == address(0) || oracle_ == address(0)) revert ZeroAddress();
        usdg = usdg_;
        oracle = oracle_;
        v3Factory = v3Factory_;
        npm = npm_;
        swapRouter = swapRouter_;
    }

    function createStrategy(address vault, address stock, uint24 poolFee, uint16 rangeWidthBps)
        external
        onlyOwner
        returns (address strategy)
    {
        if (vault == address(0) || stock == address(0)) revert ZeroAddress();
        if (strategyOf[vault] != address(0)) revert Duplicate();
        StockMarketStrategy deployed = new StockMarketStrategy(
            vault, stock, usdg, oracle, v3Factory, npm, swapRouter, poolFee, rangeWidthBps, owner()
        );
        strategy = address(deployed);
        strategyOf[vault] = strategy;
        allStrategies.push(strategy);
        emit StrategyDeployed(vault, stock, strategy, StockMarketStrategy(strategy).pool());
    }

    function strategyCount() external view returns (uint256) {
        return allStrategies.length;
    }
}
