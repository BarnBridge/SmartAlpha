// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.6;

import "./SmartAlpha.sol";

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

    /// @notice Return the estimated parameters for the next epoch based on the current conditions
    /// @dev This is intended for frontend use only
    /// @param smartAlphaAddress The address of the SMART Alpha system in which to check
    /// @return The estimated parameters of the next epoch
    function estimateNextEpoch(address smartAlphaAddress) external view returns (EstimatedEpoch memory) {
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
    function userRedeemableJuniorTokens(address smartAlphaAddress, address user) external returns (uint256) {
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
    function userRedeemableSeniorTokens(address smartAlphaAddress, address user) external returns (uint256) {
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
    function userRedeemableJuniorUnderlying(address smartAlphaAddress, address user) external returns (uint256) {
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
    function userRedeemableSeniorUnderlying(address smartAlphaAddress, address user) external returns (uint256) {
        SmartAlpha sa = SmartAlpha(smartAlphaAddress);

        sa.advanceEpoch();

        (uint256 epoch, uint256 amount) = sa.seniorExitQueue(user);
        if (amount == 0 || epoch >= sa.epoch()) {
            return 0;
        }

        uint256 price = sa.history_epochSeniorTokenPrice(epoch);

        return amount * price / scaleFactor;
    }
}
