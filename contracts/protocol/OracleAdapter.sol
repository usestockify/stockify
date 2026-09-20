// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAggregatorV3, IOracleAdapter} from "./Interfaces.sol";

interface IRobinhoodStock {
    function oraclePaused() external view returns (bool);
}

/// @notice Chainlink tokenized-equity adapter. Feeds are configured from the official directory at deploy.
contract OracleAdapter is Ownable, IOracleAdapter {
    struct Feed {
        address proxy;
        uint32 heartbeat;
        uint8 decimals;
        bool enabled;
    }

    address public immutable usdg;
    address public usdgFeed;
    uint32 public usdgHeartbeat;
    uint8 public usdgDecimals;
    uint32 public staleGrace = 2 hours;

    mapping(address => Feed) public feeds;

    event FeedSet(address indexed stock, address indexed proxy, uint32 heartbeat, uint8 decimals);
    event UsdgFeedSet(address indexed proxy, uint32 heartbeat, uint8 decimals);
    event StaleGraceSet(uint32 grace);

    error InvalidFeed();
    error StalePrice();
    error OracleIsPaused();
    error ZeroAddress();

    constructor(address usdg_, address owner_) Ownable(owner_) {
        if (usdg_ == address(0)) revert ZeroAddress();
        usdg = usdg_;
    }

    function setStaleGrace(uint32 grace) external onlyOwner {
        staleGrace = grace;
        emit StaleGraceSet(grace);
    }

    function setUsdgFeed(address proxy, uint32 heartbeat) external onlyOwner {
        if (proxy == address(0) || heartbeat == 0) revert InvalidFeed();
        uint8 dec = IAggregatorV3(proxy).decimals();
        (, int256 answer, , uint256 updatedAt, ) = IAggregatorV3(proxy).latestRoundData();
        if (answer <= 0 || updatedAt == 0) revert InvalidFeed();
        usdgFeed = proxy;
        usdgHeartbeat = heartbeat;
        usdgDecimals = dec;
        emit UsdgFeedSet(proxy, heartbeat, dec);
    }

    function setFeed(address stock, address proxy, uint32 heartbeat) external onlyOwner {
        if (stock == address(0) || proxy == address(0) || heartbeat == 0) revert InvalidFeed();
        uint8 dec = IAggregatorV3(proxy).decimals();
        (, int256 answer, , uint256 updatedAt, ) = IAggregatorV3(proxy).latestRoundData();
        if (answer <= 0 || updatedAt == 0) revert InvalidFeed();
        feeds[stock] = Feed({proxy: proxy, heartbeat: heartbeat, decimals: dec, enabled: true});
        emit FeedSet(stock, proxy, heartbeat, dec);
    }

    function latestStockUsd(address stock) public view returns (uint256 price, uint8 decimals, uint256 updatedAt) {
        Feed memory f = feeds[stock];
        if (!f.enabled) revert InvalidFeed();
        (uint80 roundId, int256 answer, , uint256 updated, uint80 answeredInRound) = IAggregatorV3(f.proxy).latestRoundData();
        if (answer <= 0 || updated == 0 || answeredInRound < roundId) revert InvalidFeed();
        return (uint256(answer), f.decimals, updated);
    }

    function latestUsdgUsd() public view returns (uint256 price, uint8 decimals, uint256 updatedAt) {
        if (usdgFeed == address(0)) revert InvalidFeed();
        (, int256 answer, , uint256 updated, ) = IAggregatorV3(usdgFeed).latestRoundData();
        if (answer <= 0 || updated == 0) revert InvalidFeed();
        return (uint256(answer), usdgDecimals, updated);
    }

    /// @return priceWad 1e18 USDG per 1e18 stock-token units (human 1:1 scaled to wad).
    function stockPriceInUsdg(address stock) public view returns (uint256 priceWad, uint256 updatedAt) {
        (uint256 stockUsd, uint8 stockDec, uint256 stockTs) = latestStockUsd(stock);
        (uint256 usdgUsd, uint8 usdgDec, uint256 usdgTs) = latestUsdgUsd();
        updatedAt = stockTs < usdgTs ? stockTs : usdgTs;
        // (stockUsd / 10^stockDec) / (usdgUsd / 10^usdgDec) * 1e18
        priceWad = (stockUsd * (10 ** (18 + usdgDec))) / (usdgUsd * (10 ** stockDec));
    }

    function isFresh(address stock) public view returns (bool) {
        Feed memory f = feeds[stock];
        if (!f.enabled || usdgFeed == address(0)) return false;
        if (oraclePaused(stock)) return false;
        (, , uint256 stockTs) = latestStockUsd(stock);
        (, , uint256 usdgTs) = latestUsdgUsd();
        uint256 now_ = block.timestamp;
        if (now_ < stockTs || now_ < usdgTs) return false;
        if (now_ - stockTs > uint256(f.heartbeat) + staleGrace) return false;
        if (now_ - usdgTs > uint256(usdgHeartbeat) + staleGrace) return false;
        return true;
    }

    function requireFresh(address stock) public view {
        if (oraclePaused(stock)) revert OracleIsPaused();
        if (!isFresh(stock)) revert StalePrice();
    }

    function oraclePaused(address stock) public view returns (bool) {
        try IRobinhoodStock(stock).oraclePaused() returns (bool paused) {
            return paused;
        } catch {
            return false;
        }
    }
}
