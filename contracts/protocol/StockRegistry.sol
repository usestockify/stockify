// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract StockRegistry is Ownable {
    struct Market {
        address stock;
        address usdg;
        address vault;
        address strategy;
        string ticker;
        bool listed;
    }

    address public immutable usdg;
    string[] public tickersIndex;
    mapping(bytes32 => Market) internal _markets;
    mapping(address => bytes32) public tickerOfStock;
    mapping(address => bytes32) public tickerOfVault;

    event MarketRegistered(string ticker, address indexed stock, address indexed vault, address indexed strategy);

    error ZeroAddress();
    error UnknownMarket();
    error AlreadyListed();

    constructor(address usdg_, address owner_) Ownable(owner_) {
        if (usdg_ == address(0)) revert ZeroAddress();
        usdg = usdg_;
    }

    function _id(string memory ticker) internal pure returns (bytes32) {
        return keccak256(bytes(ticker));
    }

    function register(string calldata ticker, address stock, address vault, address strategy) external onlyOwner {
        if (stock == address(0) || vault == address(0) || strategy == address(0)) revert ZeroAddress();
        bytes32 id = _id(ticker);
        if (_markets[id].listed) revert AlreadyListed();
        _markets[id] = Market({stock: stock, usdg: usdg, vault: vault, strategy: strategy, ticker: ticker, listed: true});
        tickerOfStock[stock] = id;
        tickerOfVault[vault] = id;
        tickersIndex.push(ticker);
        emit MarketRegistered(ticker, stock, vault, strategy);
    }

    function marketCount() external view returns (uint256) {
        return tickersIndex.length;
    }

    function market(string calldata ticker) external view returns (Market memory) {
        Market memory m = _markets[_id(ticker)];
        if (!m.listed) revert UnknownMarket();
        return m;
    }

    function marketByStock(address stock) external view returns (Market memory) {
        Market memory m = _markets[tickerOfStock[stock]];
        if (!m.listed) revert UnknownMarket();
        return m;
    }

    function allTickers() external view returns (string[] memory) {
        return tickersIndex;
    }
}
