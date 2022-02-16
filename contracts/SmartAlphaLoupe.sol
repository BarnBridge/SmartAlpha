// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.6;

import "./SmartAlpha.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title SMART Alpha Loupe contract
/// @notice This contract is intended as a helper for the frontend implementation.
contract SmartAlphaLoupe {
    uint256 constant public scaleFactor = 10 ** 18;

    struct EstimatedEpoch {
        uint256 juniorLiquidity;
        uint256 seniorLiquidity;
        uint256 upsideRate;
        uint256 downsideRate;
        uint256 startPrice;
    }

    struct QueuePosition {
        uint256 epoch;
        uint256 amount;
    }

    struct UserPosition {
        address pool;
        uint256 juniorTokenBalance;
        uint256 seniorTokenBalance;
        uint256 estimatedJuniorTokenPrice;
        uint256 estimatedSeniorTokenPrice;
        uint256 poolTokenPriceInQuoteAsset;
        uint256 enteringJuniorUnderlying;
        uint256 enteringSeniorUnderlying;
        uint256 redeemableJuniorTokens;
        uint256 redeemableSeniorTokens;
        uint256 exitingJuniorTokens;
        uint256 exitingSeniorTokens;
        uint256 redeemableJuniorUnderlying;
        uint256 redeemableSeniorUnderlying;
        QueuePosition juniorEntryQueue;
        QueuePosition seniorEntryQueue;
        QueuePosition juniorExitQueue;
        QueuePosition seniorExitQueue;
    }

    /// @notice Return the estimated parameters for the next epoch based on the current conditions
    /// @dev This is intended for frontend use only
    /// @param smartAlphaAddress The address of the SMART Alpha system in which to check
    /// @return The estimated parameters of the next epoch
    function estimateNextEpoch(address smartAlphaAddress) public view returns (EstimatedEpoch memory) {
        EstimatedEpoch memory e;

        SmartAlpha sa = SmartAlpha(smartAlphaAddress);

        e.startPrice = sa.priceOracle().getPrice();

        {
            uint256 queuedJuniorTokensBurn = sa.queuedJuniorTokensBurn();
            uint256 queuedSeniorTokensBurn = sa.queuedSeniorTokensBurn();
            uint256 queuedJuniorUnderlyingIn = sa.queuedJuniorsUnderlyingIn();
            uint256 queuedSeniorUnderlyingIn = sa.queuedSeniorsUnderlyingIn();

            uint256 estimatedJuniorTokenPrice = sa.estimateCurrentJuniorTokenPrice();
            uint256 estimatedSeniorTokenPrice = sa.estimateCurrentSeniorTokenPrice();

            uint256 estimatedJuniorLiquidity = sa.estimateCurrentJuniorLiquidity();
            uint256 estimatedSeniorLiquidity = sa.estimateCurrentSeniorLiquidity();

            uint256 estimatedJuniorUnderlyingOut = queuedJuniorTokensBurn * estimatedJuniorTokenPrice / scaleFactor;
            uint256 estimatedSeniorUnderlyingOut = queuedSeniorTokensBurn * estimatedSeniorTokenPrice / scaleFactor;

            e.juniorLiquidity = estimatedJuniorLiquidity + queuedJuniorUnderlyingIn - estimatedJuniorUnderlyingOut;
            e.seniorLiquidity = estimatedSeniorLiquidity + queuedSeniorUnderlyingIn - estimatedSeniorUnderlyingOut;
        }

        (uint256 up, uint256 down) = sa.seniorRateModel().getRates(e.juniorLiquidity, e.seniorLiquidity);
        e.upsideRate = up;
        e.downsideRate = down;

        return e;
    }

    /// @notice Return the amount of redeemable junior tokens for a user in a SMART Alpha system
    /// @dev This should be called statically on frontend
    /// @param smartAlphaAddress The address of the SMART Alpha system in which to check
    /// @param user The address of the user for which to check
    /// @return The amount of redeemable junior tokens
    function userRedeemableJuniorTokens(address smartAlphaAddress, address user) public returns (uint256) {
        SmartAlpha sa = SmartAlpha(smartAlphaAddress);

        sa.advanceEpoch();

        (uint256 epoch, uint256 amount) = sa.juniorEntryQueue(user);
        if (amount == 0 || epoch >= sa.epoch()) {
            return 0;
        }

        uint256 price = sa.history_epochJuniorTokenPrice(epoch);

        return amount * scaleFactor / price;
    }

    /// @notice Return the amount of redeemable senior tokens for a user in a SMART Alpha system
    /// @dev This should be called statically on frontend
    /// @param smartAlphaAddress The address of the SMART Alpha system in which to check
    /// @param user The address of the user for which to check
    /// @return The amount of redeemable senior tokens
    function userRedeemableSeniorTokens(address smartAlphaAddress, address user) public returns (uint256) {
        SmartAlpha sa = SmartAlpha(smartAlphaAddress);

        sa.advanceEpoch();

        (uint256 epoch, uint256 amount) = sa.seniorEntryQueue(user);
        if (amount == 0 || epoch >= sa.epoch()) {
            return 0;
        }

        uint256 price = sa.history_epochSeniorTokenPrice(epoch);

        return amount * scaleFactor / price;
    }

    /// @notice Return the amount of redeemable junior underlying for a user in a SMART Alpha system
    /// @dev This should be called statically on frontend
    /// @param smartAlphaAddress The address of the SMART Alpha system in which to check
    /// @param user The address of the user for which to check
    /// @return The amount of redeemable junior underlying
    function userRedeemableJuniorUnderlying(address smartAlphaAddress, address user) public returns (uint256) {
        SmartAlpha sa = SmartAlpha(smartAlphaAddress);

        sa.advanceEpoch();

        (uint256 epoch, uint256 amount) = sa.juniorExitQueue(user);
        if (amount == 0 || epoch >= sa.epoch()) {
            return 0;
        }

        uint256 price = sa.history_epochJuniorTokenPrice(epoch);

        return amount * price / scaleFactor;
    }

    /// @notice Return the amount of redeemable senior underlying for a user in a SMART Alpha system
    /// @dev This should be called statically on frontend
    /// @param smartAlphaAddress The address of the SMART Alpha system in which to check
    /// @param user The address of the user for which to check
    /// @return The amount of redeemable senior underlying
    function userRedeemableSeniorUnderlying(address smartAlphaAddress, address user) public returns (uint256) {
        SmartAlpha sa = SmartAlpha(smartAlphaAddress);

        sa.advanceEpoch();

        (uint256 epoch, uint256 amount) = sa.seniorExitQueue(user);
        if (amount == 0 || epoch >= sa.epoch()) {
            return 0;
        }

        uint256 price = sa.history_epochSeniorTokenPrice(epoch);

        return amount * price / scaleFactor;
    }

    function userPositions(address[] memory pools, address user) external returns (UserPosition[] memory) {
        UserPosition[] memory positions = new UserPosition[](pools.length);
        for (uint i = 0; i < pools.length; i++) {
            SmartAlpha sa = SmartAlpha(pools[i]);
            sa.advanceEpoch();

            uint256 currentEpoch = sa.getCurrentEpoch();

            positions[i].pool = pools[i];
            positions[i].juniorTokenBalance = IERC20(sa.juniorToken()).balanceOf(user);
            positions[i].seniorTokenBalance = IERC20(sa.seniorToken()).balanceOf(user);
            positions[i].estimatedJuniorTokenPrice = sa.estimateCurrentJuniorTokenPrice();
            positions[i].estimatedSeniorTokenPrice = sa.estimateCurrentSeniorTokenPrice();
            positions[i].poolTokenPriceInQuoteAsset = sa.priceOracle().getPrice();
            positions[i].redeemableJuniorTokens = userRedeemableJuniorTokens(pools[i], user);
            positions[i].redeemableSeniorTokens = userRedeemableSeniorTokens(pools[i], user);
            positions[i].redeemableJuniorUnderlying = userRedeemableJuniorUnderlying(pools[i], user);
            positions[i].redeemableSeniorUnderlying = userRedeemableSeniorUnderlying(pools[i], user);

            uint256 epoch; uint256 amount;
            (epoch, amount) = sa.juniorEntryQueue(user);
            positions[i].juniorEntryQueue = QueuePosition(epoch, amount);
            if (epoch == currentEpoch) {
                positions[i].enteringJuniorUnderlying = amount;
            }

            (epoch, amount) = sa.juniorExitQueue(user);
            positions[i].juniorExitQueue = QueuePosition(epoch, amount);
            if (epoch == currentEpoch) {
                positions[i].exitingJuniorTokens = amount;
            }

            (epoch, amount) = sa.seniorEntryQueue(user);
            positions[i].seniorEntryQueue = QueuePosition(epoch, amount);
            if (epoch == currentEpoch) {
                positions[i].enteringSeniorUnderlying = amount;
            }

            (epoch, amount) = sa.seniorExitQueue(user);
            positions[i].seniorExitQueue = QueuePosition(epoch, amount);
            if (epoch == currentEpoch) {
                positions[i].exitingSeniorTokens = amount;
            }
         }

        return positions;
    }
}
