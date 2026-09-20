// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {StockifyVault} from "./StockifyVault.sol";
import {StockRegistry} from "./StockRegistry.sol";

/// @notice Thin deposit/redeem helper. No arbitrary token pull.
contract StockifyRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable usdg;
    StockRegistry public immutable registry;

    event Deposited(address indexed vault, address indexed owner, uint256 assets, uint256 shares);
    event Redeemed(address indexed vault, address indexed owner, uint256 shares, uint256 assets);

    error UnknownVault();
    error Slippage();
    error Zero();

    constructor(address usdg_, address registry_) {
        usdg = usdg_;
        registry = StockRegistry(registry_);
    }

    function deposit(address vault, uint256 assets, address receiver, uint256 minShares)
        external
        nonReentrant
        returns (uint256 shares)
    {
        if (assets == 0) revert Zero();
        _known(vault);
        IERC20(usdg).safeTransferFrom(msg.sender, address(this), assets);
        IERC20(usdg).forceApprove(vault, assets);
        shares = StockifyVault(vault).deposit(assets, receiver);
        IERC20(usdg).forceApprove(vault, 0);
        if (shares < minShares) revert Slippage();
        emit Deposited(vault, receiver, assets, shares);
    }

    function redeem(address vault, uint256 shares, address receiver, uint256 minAssets)
        external
        nonReentrant
        returns (uint256 assets)
    {
        if (shares == 0) revert Zero();
        _known(vault);
        IERC20(vault).safeTransferFrom(msg.sender, address(this), shares);
        assets = StockifyVault(vault).redeem(shares, receiver, address(this));
        if (assets < minAssets) revert Slippage();
        emit Redeemed(vault, receiver, shares, assets);
    }

    function _known(address vault) internal view {
        if (registry.tickerOfVault(vault) == bytes32(0)) revert UnknownVault();
    }
}
