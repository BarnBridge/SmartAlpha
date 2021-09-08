# SmartAlpha


This contract implements the main logic of the system.


## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Globals](#globals)
- [Functions](#functions)
  - [constructor](#constructor)
  - [initialize](#initialize)
  - [advanceEpoch](#advanceepoch)
  - [depositJunior](#depositjunior)
  - [redeemJuniorTokens](#redeemjuniortokens)
  - [depositSenior](#depositsenior)
  - [redeemSeniorTokens](#redeemseniortokens)
  - [exitJunior](#exitjunior)
  - [redeemJuniorUnderlying](#redeemjuniorunderlying)
  - [exitSenior](#exitsenior)
  - [redeemSeniorUnderlying](#redeemseniorunderlying)
  - [transferFees](#transferfees)
  - [getCurrentEpoch](#getcurrentepoch)
  - [getCurrentJuniorProfits](#getcurrentjuniorprofits)
  - [getCurrentSeniorProfits](#getcurrentseniorprofits)
  - [epochBalance](#epochbalance)
  - [underlyingInQueues](#underlyinginqueues)
  - [feesAccrued](#feesaccrued)
  - [getEpochJuniorTokenPrice](#getepochjuniortokenprice)
  - [getEpochSeniorTokenPrice](#getepochseniortokenprice)
  - [estimateCurrentSeniorLiquidity](#estimatecurrentseniorliquidity)
  - [estimateCurrentJuniorLiquidity](#estimatecurrentjuniorliquidity)
  - [estimateCurrentSeniorTokenPrice](#estimatecurrentseniortokenprice)
  - [estimateCurrentJuniorTokenPrice](#estimatecurrentjuniortokenprice)
  - [_processJuniorQueues](#_processjuniorqueues)
  - [_processSeniorQueues](#_processseniorqueues)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Globals

> Note this contains internal vars as well due to a bug in the docgen procedure

| Var | Type |
| --- | --- |
| scaleFactor | uint256 |
| initialized | bool |
| poolToken | contract IERC20 |
| juniorToken | contract OwnableERC20 |
| seniorToken | contract OwnableERC20 |
| epoch1Start | uint256 |
| epochDuration | uint256 |
| epoch | uint256 |
| epochSeniorLiquidity | uint256 |
| epochJuniorLiquidity | uint256 |
| epochUpsideExposureRate | uint256 |
| epochDownsideProtectionRate | uint256 |
| epochEntryPrice | uint256 |
| queuedJuniorsUnderlyingIn | uint256 |
| queuedJuniorsUnderlyingOut | uint256 |
| queuedJuniorTokensBurn | uint256 |
| queuedSeniorsUnderlyingIn | uint256 |
| queuedSeniorsUnderlyingOut | uint256 |
| queuedSeniorTokensBurn | uint256 |
| history_epochJuniorTokenPrice | mapping(uint256 => uint256) |
| history_epochSeniorTokenPrice | mapping(uint256 => uint256) |
| juniorEntryQueue | mapping(address => struct SmartAlpha.QueuePosition) |
| juniorExitQueue | mapping(address => struct SmartAlpha.QueuePosition) |
| seniorEntryQueue | mapping(address => struct SmartAlpha.QueuePosition) |
| seniorExitQueue | mapping(address => struct SmartAlpha.QueuePosition) |



## Functions

### constructor
No description


#### Declaration
```solidity
  function constructor(
  ) public Governed
```

#### Modifiers:
| Modifier |
| --- |
| Governed |



### initialize
Initialize the SmartAlpha system

> Junior and Senior tokens must be owner by this contract or the function will revert.


#### Declaration
```solidity
  function initialize(
    address poolTokenAddr,
    address oracleAddr,
    address seniorRateModelAddr,
    address accountingModelAddr,
    address juniorTokenAddr,
    address seniorTokenAddr,
    uint256 _epoch1Start,
    uint256 _epochDuration
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`poolTokenAddr` | address | Address of the pool token
|`oracleAddr` | address | Address of the price oracle for the pool token
|`seniorRateModelAddr` | address | Address of the senior rate model (used to calculate upside exposure and downside protection rates)
|`accountingModelAddr` | address | Address of the accounting model (used to determine the junior or senior losses for an epoch)
|`juniorTokenAddr` | address | Address of the junior token (ERC20)
|`seniorTokenAddr` | address | Address of the senior token (ERC20)
|`_epoch1Start` | uint256 | Timestamp at which the first epoch begins
|`_epochDuration` | uint256 | Duration of the epoch in seconds

### advanceEpoch
Advance/finalize an epoch

> Epochs are automatically advanced/finalized if there are user interactions with the contract.
If there are no interactions for one or multiple epochs, they will be skipped and the materializing of
profits and losses will only happen as if only one epoch passed. We call this "elastic epochs".
This function may also be called voluntarily by any party (including bots).

#### Declaration
```solidity
  function advanceEpoch(
  ) public
```

#### Modifiers:
No modifiers



### depositJunior
Signal the entry into the pool as a junior

> If the user already has a position in the queue, they can increase the amount by calling this function again
If a user is in the queue, they cannot exit it


#### Declaration
```solidity
  function depositJunior(
    uint256 amount
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`amount` | uint256 | The amount of underlying the user wants to increase his queue position with

### redeemJuniorTokens
Redeem the junior tokens generated for a user that participated in the queue at a specific epoch

> User will receive an amount of junior tokens corresponding to his underlying balance converted at the price the epoch was finalized
This only works for past epochs and will revert if called for current or future epochs.

#### Declaration
```solidity
  function redeemJuniorTokens(
  ) public
```

#### Modifiers:
No modifiers



### depositSenior
Signal the entry into the pool as a senior

> If the user already has a position in the queue, they can increase the amount by calling this function again
If a user is in the queue, they cannot exit it


#### Declaration
```solidity
  function depositSenior(
    uint256 amount
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`amount` | uint256 | The amount of underlying the user wants to increase his queue position with

### redeemSeniorTokens
Redeem the senior tokens generated for a user that participated in the queue at a specific epoch

> User will receive an amount of senior tokens corresponding to his underlying balance converted at the price the epoch was finalized
This only works for past epochs and will revert if called for current or future epochs.

#### Declaration
```solidity
  function redeemSeniorTokens(
  ) public
```

#### Modifiers:
No modifiers



### exitJunior
Signal the intention to leave the pool as a junior

> User will join the exit queue and his junior tokens will be transferred back to the pool.
Their tokens will be burned when the epoch is finalized and the underlying due will be set aside.
Users can increase their queue amount but can't exit the queue


#### Declaration
```solidity
  function exitJunior(
    uint256 amountJuniorTokens
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`amountJuniorTokens` | uint256 | The amount of tokens the user wants to exit with

### redeemJuniorUnderlying
Redeem the underlying for an exited epoch

> Only works if the user signaled the intention to exit the pool by entering the queue for that epoch.
Can only be called for a previous epoch and will revert for current and future epochs.
At this point, the junior tokens were burned by the contract and the underlying was set aside.

#### Declaration
```solidity
  function redeemJuniorUnderlying(
  ) public
```

#### Modifiers:
No modifiers



### exitSenior
Signal the intention to leave the pool as a senior

> User will join the exit queue and his senior tokens will be transferred back to the pool.
Their tokens will be burned when the epoch is finalized and the underlying due will be set aside.
Users can increase their queue amount but can't exit the queue


#### Declaration
```solidity
  function exitSenior(
    uint256 amountSeniorTokens
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`amountSeniorTokens` | uint256 | The amount of tokens the user wants to exit with

### redeemSeniorUnderlying
Redeem the underlying for an exited epoch

> Only works if the user signaled the intention to exit the pool by entering the queue for that epoch.
Can only be called for a previous epoch and will revert for current and future epochs.
At this point, the senior tokens were burned by the contract and the underlying was set aside.

#### Declaration
```solidity
  function redeemSeniorUnderlying(
  ) public
```

#### Modifiers:
No modifiers



### transferFees
Transfer the accrued fees to the fees owner

> Anyone can call but fees are transferred to fees owner. Reverts if no fees accrued.

#### Declaration
```solidity
  function transferFees(
  ) public
```

#### Modifiers:
No modifiers



### getCurrentEpoch
Calculates the current epoch based on the start of the first epoch and the epoch duration



#### Declaration
```solidity
  function getCurrentEpoch(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | id of the current epoch
### getCurrentJuniorProfits
Calculates the junior profits based on current pool conditions

> It always returns 0 if the price went down.


#### Declaration
```solidity
  function getCurrentJuniorProfits(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | amount, in pool tokens, that is considered profit for the juniors
### getCurrentSeniorProfits
Calculates the junior losses (in other words, senior profits) based on the current pool conditions

> It always returns 0 if the price went up.


#### Declaration
```solidity
  function getCurrentSeniorProfits(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | amount, in pool tokens, that is considered loss for the juniors
### epochBalance
Calculate the epoch balance



#### Declaration
```solidity
  function epochBalance(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`epoch` | balance
### underlyingInQueues
Return the total amount of underlying in the queues



#### Declaration
```solidity
  function underlyingInQueues(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`amount` | of underlying in the queues
### feesAccrued
Calculate the total fees accrued

> We consider fees any amount of underlying that is not accounted for in the epoch balance & queues

#### Declaration
```solidity
  function feesAccrued(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers



### getEpochJuniorTokenPrice
Return the price of the junior token for the current epoch

> If there's no supply, it returns 1 (scaled by scaleFactor).
It does not take into account the current profits and losses.


#### Declaration
```solidity
  function getEpochJuniorTokenPrice(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | price of a junior token in pool tokens
### getEpochSeniorTokenPrice
Return the price of the senior token for the current epoch

> If there's no supply, it returns 1 (scaled by scaleFactor).
It does not take into account the current profits and losses.


#### Declaration
```solidity
  function getEpochSeniorTokenPrice(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | price of a senior token in pool tokens
### estimateCurrentSeniorLiquidity
Return the senior liquidity taking into account the current, unrealized, profits and losses



#### Declaration
```solidity
  function estimateCurrentSeniorLiquidity(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | estimated senior liquidity
### estimateCurrentJuniorLiquidity
Return the junior liquidity taking into account the current, unrealized, profits and losses



#### Declaration
```solidity
  function estimateCurrentJuniorLiquidity(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | estimated junior liquidity
### estimateCurrentSeniorTokenPrice
Return the current senior token price taking into account the current, unrealized, profits and losses



#### Declaration
```solidity
  function estimateCurrentSeniorTokenPrice(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | estimated senior token price
### estimateCurrentJuniorTokenPrice
Return the current junior token price taking into account the current, unrealized, profits and losses



#### Declaration
```solidity
  function estimateCurrentJuniorTokenPrice(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | estimated junior token price
### _processJuniorQueues
Process the junior entry and exit queues

> It saves the junior token price valid for the stored epoch to storage for further reference.
It optimizes gas usage by re-using some of the tokens it already has minted which leads to only one of the {mint, burn} actions to be executed.
All queued positions will be converted into junior tokens or underlying at the same price.


#### Declaration
```solidity
  function _processJuniorQueues(
  ) internal returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | amount of underlying (pool tokens) that should be set aside
### _processSeniorQueues
Process the senior entry and exit queues

> It saves the senior token price valid for the stored epoch to storage for further reference.
It optimizes gas usage by re-using some of the tokens it already has minted which leads to only one of the {mint, burn} actions to be executed.
All queued positions will be converted into senior tokens or underlying at the same price.


#### Declaration
```solidity
  function _processSeniorQueues(
  ) internal returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | amount of underlying (pool tokens) that should be set aside


