# SmartAlphaEvents





## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Events](#events)
  - [JuniorJoinEntryQueue](#juniorjoinentryqueue)
  - [JuniorRedeemTokens](#juniorredeemtokens)
  - [JuniorJoinExitQueue](#juniorjoinexitqueue)
  - [JuniorRedeemUnderlying](#juniorredeemunderlying)
  - [SeniorJoinEntryQueue](#seniorjoinentryqueue)
  - [SeniorRedeemTokens](#seniorredeemtokens)
  - [SeniorJoinExitQueue](#seniorjoinexitqueue)
  - [SeniorRedeemUnderlying](#seniorredeemunderlying)
  - [EpochEnd](#epochend)
  - [FeesTransfer](#feestransfer)
  - [TransferDAO](#transferdao)
  - [TransferGuardian](#transferguardian)
  - [PauseSystem](#pausesystem)
  - [ResumeSystem](#resumesystem)
  - [SetPriceOracle](#setpriceoracle)
  - [SetSeniorRateModel](#setseniorratemodel)
  - [SetAccountingModel](#setaccountingmodel)
  - [SetFeesOwner](#setfeesowner)
  - [SetFeesPercentage](#setfeespercentage)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->






## Events

### JuniorJoinEntryQueue
Logs a deposit of a junior


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`user` | address | :white_check_mark: | Address of the caller
|`epochId` | uint256 |  | The epoch in which they entered the queue
|`underlyingIn` | uint256 |  | The amount of underlying deposited
|`currentQueueBalance` | uint256 |  | The total balance of the user in the queue for the current epoch
### JuniorRedeemTokens
Logs a redeem (2nd step of deposit) of a junior


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`user` | address | :white_check_mark: | Address of the caller
|`epochId` | uint256 |  | The epoch for which the redeem was executed
|`tokensOut` | uint256 |  | The amount of junior tokens redeemed
### JuniorJoinExitQueue
Logs an exit (1st step) of a junior


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`user` | address | :white_check_mark: | Address of the caller
|`epochId` | uint256 |  | The epoch in which they entered the queue
|`tokensIn` | uint256 |  | The amount of junior tokens deposited into the queue
|`currentQueueBalance` | uint256 |  | The total balance of the user in the queue for the current epoch
### JuniorRedeemUnderlying
Logs an exit (2nd step) of a junior


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`user` | address | :white_check_mark: | Address of the caller
|`epochId` | uint256 |  | The epoch for which the redeem was executed
|`underlyingOut` | uint256 |  | The amount of underlying transferred to the user
### SeniorJoinEntryQueue
Logs a deposit of a senior


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`user` | address | :white_check_mark: | Address of the caller
|`epochId` | uint256 |  | The epoch in which they entered the queue
|`underlyingIn` | uint256 |  | The amount of underlying deposited
|`currentQueueBalance` | uint256 |  | The total balance of the user in the queue for the current epoch
### SeniorRedeemTokens
Logs a redeem (2nd step of deposit) of a senior


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`user` | address | :white_check_mark: | Address of the caller
|`epochId` | uint256 |  | The epoch for which the redeem was executed
|`tokensOut` | uint256 |  | The amount of senior tokens redeemed
### SeniorJoinExitQueue
Logs an exit (1st step) of a senior


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`user` | address | :white_check_mark: | Address of the caller
|`epochId` | uint256 |  | The epoch in which they entered the queue
|`tokensIn` | uint256 |  | The amount of senior tokens deposited into the queue
|`currentQueueBalance` | uint256 |  | The total balance of the user in the queue for the current epoch
### SeniorRedeemUnderlying
Logs an exit (2nd step) of a senior


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`user` | address | :white_check_mark: | Address of the caller
|`epochId` | uint256 |  | The epoch for which the redeem was executed
|`underlyingOut` | uint256 |  | The amount of underlying transferred to the user
### EpochEnd
Logs an epoch end


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`epochId` | uint256 |  | The id of the epoch that just ended
|`juniorProfits` | uint256 |  | The amount of junior profits for the epoch that ended in underlying tokens
|`seniorProfits` | uint256 |  | The amount of senior profits for the epoch that ended in underlying tokens
### FeesTransfer
Logs a transfer of fees


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`caller` | address |  | The caller of the function
|`destination` | address |  | The destination address of the funds
|`amount` | uint256 |  | The amount of tokens that were transferred
### TransferDAO
Logs a transfer of dao power to a new address


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`oldDAO` | address |  | The address of the old DAO
|`newDAO` | address |  | The address of the new DAO
### TransferGuardian
Logs a transfer of Guardian power to a new address


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`oldGuardian` | address |  | The address of the old guardian
|`newGuardian` | address |  | The address of the new guardian
### PauseSystem
Logs a system pause

  


### ResumeSystem
logs a system resume

  


### SetPriceOracle
logs a change of price oracle


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`oldOracle` | address |  | Address of the old oracle
|`newOracle` | address |  | Address of the new oracle
### SetSeniorRateModel
Logs a change of senior rate model contract


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`oldModel` | address |  | Address of the old model
|`newModel` | address |  | Address of the new model
### SetAccountingModel
Logs a change of accounting model contract


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`oldModel` | address |  | Address of the old model
|`newModel` | address |  | Address of the new model
### SetFeesOwner
Logs a change of fees owner


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`oldOwner` | address |  | Address of the old owner of fees
|`newOwner` | address |  | Address of the new owner of fees
### SetFeesPercentage
Logs a change of fees percentage


  

#### Params:
| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`oldPercentage` | uint256 |  | The old percentage of fees
|`newPercentage` | uint256 |  | The new percentage of fees
