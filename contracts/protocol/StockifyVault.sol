// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IStockMarketStrategy} from "./Interfaces.sol";

/// @notice ERC-4626 USDG vault. One instance per stock. Assets sit idle or in the paired strategy.
contract StockifyVault is ERC4626, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable stock;
    string public ticker;
    IStockMarketStrategy public strategy;
    uint256 public principal;
    uint256 public constant MIN_DEPOSIT = 1e4; // 0.01 USDG at 6 decimals

    event StrategyBound(address indexed strategy);
    event Allocated(uint256 amount);
    event Unwound(uint256 requested, uint256 returned);

    error ZeroAmount();
    error StrategyAlreadySet();
    error DustDeposit();
    error NotStrategy();

    constructor(
        IERC20 usdg_,
        address stock_,
        string memory ticker_,
        string memory name_,
        string memory symbol_,
        address owner_
    ) ERC20(name_, symbol_) ERC4626(usdg_) Ownable(owner_) {
        require(stock_ != address(0), "STOCK");
        stock = stock_;
        ticker = ticker_;
    }

    function _decimalsOffset() internal pure override returns (uint8) {
        return 3;
    }

    function bindStrategy(address strategy_) external onlyOwner {
        if (address(strategy) != address(0)) revert StrategyAlreadySet();
        if (strategy_ == address(0)) revert ZeroAmount();
        strategy = IStockMarketStrategy(strategy_);
        emit StrategyBound(strategy_);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function totalAssets() public view override returns (uint256) {
        uint256 idle = IERC20(asset()).balanceOf(address(this));
        if (address(strategy) == address(0)) return idle;
        return idle + strategy.totalAssets();
    }

    function deposit(uint256 assets, address receiver) public override nonReentrant whenNotPaused returns (uint256) {
        if (assets == 0) revert ZeroAmount();
        if (assets < MIN_DEPOSIT && totalSupply() == 0) revert DustDeposit();
        uint256 shares = super.deposit(assets, receiver);
        principal += assets;
        _allocate();
        return shares;
    }

    function mint(uint256 shares, address receiver) public override nonReentrant whenNotPaused returns (uint256) {
        if (shares == 0) revert ZeroAmount();
        uint256 assets = previewMint(shares);
        if (assets < MIN_DEPOSIT && totalSupply() == 0) revert DustDeposit();
        assets = super.mint(shares, receiver);
        principal += assets;
        _allocate();
        return assets;
    }

    function withdraw(uint256 assets, address receiver, address owner_)
        public
        override
        nonReentrant
        returns (uint256)
    {
        if (assets == 0) revert ZeroAmount();
        _ensureLiquidity(assets);
        uint256 shares = super.withdraw(assets, receiver, owner_);
        _reducePrincipal(assets);
        return shares;
    }

    function redeem(uint256 shares, address receiver, address owner_)
        public
        override
        nonReentrant
        returns (uint256)
    {
        if (shares == 0) revert ZeroAmount();
        uint256 assets = previewRedeem(shares);
        _ensureLiquidity(assets);
        assets = super.redeem(shares, receiver, owner_);
        _reducePrincipal(assets);
        return assets;
    }

    function _allocate() internal {
        if (paused()) return;
        if (address(strategy) == address(0)) return;
        IERC20 usdg = IERC20(asset());
        uint256 idle = usdg.balanceOf(address(this));
        if (idle == 0) return;
        usdg.safeTransfer(address(strategy), idle);
        strategy.deposit(idle);
        emit Allocated(idle);
    }

    function _ensureLiquidity(uint256 assets) internal {
        IERC20 usdg = IERC20(asset());
        uint256 idle = usdg.balanceOf(address(this));
        if (idle >= assets) return;
        if (address(strategy) == address(0)) revert ZeroAmount();
        uint256 need = assets - idle;
        uint256 got = strategy.withdraw(need, address(this));
        emit Unwound(need, got);
        if (usdg.balanceOf(address(this)) < assets) revert ZeroAmount();
    }

    function _reducePrincipal(uint256 assets) internal {
        if (assets >= principal) principal = 0;
        else principal -= assets;
    }
}
