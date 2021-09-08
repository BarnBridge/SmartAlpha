# SmartAlphaLoupe


This contract is intended as a helper for the frontend implementation.


## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Globals](#globals)
- [Functions](#functions)
  - [estimateNextEpoch](#estimatenextepoch)
  - [userRedeemableJuniorTokens](#userredeemablejuniortokens)
  - [userRedeemableSeniorTokens](#userredeemableseniortokens)
  - [userRedeemableJuniorUnderlying](#userredeemablejuniorunderlying)
  - [userRedeemableSeniorUnderlying](#userredeemableseniorunderlying)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Globals

> Note this contains internal vars as well due to a bug in the docgen procedure

| Var | Type |
| --- | --- |
| scaleFactor | uint256 |



## Functions

### estimateNextEpoch
Return the estimated parameters for the next epoch based on the current conditions

> This is intended for frontend use only


#### Declaration
```solidity
  function estimateNextEpoch(
    address smartAlphaAddress
  ) external returns (struct SmartAlphaLoupe.EstimatedEpoch)
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`smartAlphaAddress` | address | The address of the SMART Alpha system in which to check

#### Returns:
| Type | Description |
| --- | --- |
|`The` | estimated parameters of the next epoch
### userRedeemableJuniorTokens
Return the amount of redeemable junior tokens for a user in a SMART Alpha system

> This should be called statically on frontend


#### Declaration
```solidity
  function userRedeemableJuniorTokens(
    address smartAlphaAddress,
    address user
  ) external returns (uint256)
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`smartAlphaAddress` | address | The address of the SMART Alpha system in which to check
|`user` | address | The address of the user for which to check

#### Returns:
| Type | Description |
| --- | --- |
|`The` | amount of redeemable junior tokens
### userRedeemableSeniorTokens
Return the amount of redeemable senior tokens for a user in a SMART Alpha system

> This should be called statically on frontend


#### Declaration
```solidity
  function userRedeemableSeniorTokens(
    address smartAlphaAddress,
    address user
  ) external returns (uint256)
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`smartAlphaAddress` | address | The address of the SMART Alpha system in which to check
|`user` | address | The address of the user for which to check

#### Returns:
| Type | Description |
| --- | --- |
|`The` | amount of redeemable senior tokens
### userRedeemableJuniorUnderlying
Return the amount of redeemable junior underlying for a user in a SMART Alpha system

> This should be called statically on frontend


#### Declaration
```solidity
  function userRedeemableJuniorUnderlying(
    address smartAlphaAddress,
    address user
  ) external returns (uint256)
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`smartAlphaAddress` | address | The address of the SMART Alpha system in which to check
|`user` | address | The address of the user for which to check

#### Returns:
| Type | Description |
| --- | --- |
|`The` | amount of redeemable junior underlying
### userRedeemableSeniorUnderlying
Return the amount of redeemable senior underlying for a user in a SMART Alpha system

> This should be called statically on frontend


#### Declaration
```solidity
  function userRedeemableSeniorUnderlying(
    address smartAlphaAddress,
    address user
  ) external returns (uint256)
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`smartAlphaAddress` | address | The address of the SMART Alpha system in which to check
|`user` | address | The address of the user for which to check

#### Returns:
| Type | Description |
| --- | --- |
|`The` | amount of redeemable senior underlying


