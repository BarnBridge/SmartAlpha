# Governed


Governance functions for SmartAlpha

> It defines a DAO and a Guardian
From a privilege perspective, the DAO is also considered Guardian, allowing it to execute any action
that the Guardian can do.

## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Globals](#globals)
- [Functions](#functions)
  - [constructor](#constructor)
  - [transferDAO](#transferdao)
  - [transferGuardian](#transferguardian)
  - [pauseSystem](#pausesystem)
  - [resumeSystem](#resumesystem)
  - [setPriceOracle](#setpriceoracle)
  - [setSeniorRateModel](#setseniorratemodel)
  - [setAccountingModel](#setaccountingmodel)
  - [setFeesOwner](#setfeesowner)
  - [setFeesPercentage](#setfeespercentage)
  - [enforceCallerDAO](#enforcecallerdao)
  - [enforceCallerGuardian](#enforcecallerguardian)
  - [enforceSystemNotPaused](#enforcesystemnotpaused)
  - [enforceHasContractCode](#enforcehascontractcode)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Globals

> Note this contains internal vars as well due to a bug in the docgen procedure

| Var | Type |
| --- | --- |
| dao | address |
| guardian | address |
| paused | bool |
| priceOracle | contract IPriceOracle |
| seniorRateModel | contract ISeniorRateModel |
| accountingModel | contract IAccountingModel |
| MAX_FEES_PERCENTAGE | uint256 |
| feesOwner | address |
| feesPercentage | uint256 |



## Functions

### constructor
No description


#### Declaration
```solidity
  function constructor(
  ) internal
```

#### Modifiers:
No modifiers



### transferDAO
Transfer the DAO to a new address

> Only callable by the current DAO. The new dao cannot be address(0) or the same dao.


#### Declaration
```solidity
  function transferDAO(
    address newDAO
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`newDAO` | address | The address of the new dao

### transferGuardian
Transfer the Guardian to a new address

> Callable by the current DAO or the current Guardian. The new Guardian cannot be address(0)
or the same as before.


#### Declaration
```solidity
  function transferGuardian(
    address newGuardian
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`newGuardian` | address | The address of the new Guardian

### pauseSystem
Pause the deposits into the system

> Callable by DAO or Guardian. It will block any junior & senior deposits until resumed.

#### Declaration
```solidity
  function pauseSystem(
  ) public
```

#### Modifiers:
No modifiers



### resumeSystem
Resume the deposits into the system

> Callable by DAO or Guardian. It will resume deposits.

#### Declaration
```solidity
  function resumeSystem(
  ) public
```

#### Modifiers:
No modifiers



### setPriceOracle
Change the price oracle

> Only callable by DAO. The address of the new price oracle must have contract code.


#### Declaration
```solidity
  function setPriceOracle(
    address newPriceOracle
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`newPriceOracle` | address | The address of the new price oracle contract

### setSeniorRateModel
Change the senior rate model contract

> Only callable by DAO. The address of the new contract must have code.


#### Declaration
```solidity
  function setSeniorRateModel(
    address newModel
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`newModel` | address | The address of the new model

### setAccountingModel
Change the accounting model contract

> Only callable by DAO. The address of the new contract must have code.


#### Declaration
```solidity
  function setAccountingModel(
    address newModel
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`newModel` | address | The address of the new model

### setFeesOwner
Change the owner of the fees

> Only callable by DAO. The new owner must not be 0 address.


#### Declaration
```solidity
  function setFeesOwner(
    address newOwner
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`newOwner` | address | The address to which fees will be transferred

### setFeesPercentage
Change the percentage of the fees applied

> Only callable by DAO. If the percentage is greater than 0, it must also have a fees owner.


#### Declaration
```solidity
  function setFeesPercentage(
    uint256 percentage
  ) public
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`percentage` | uint256 | The percentage of profits to be taken as fee

### enforceCallerDAO
Helper function to enforce that the call comes from the DAO

> Reverts the execution if msg.sender is not the DAO.

#### Declaration
```solidity
  function enforceCallerDAO(
  ) internal
```

#### Modifiers:
No modifiers



### enforceCallerGuardian
Helper function to enforce that the call comes from the Guardian

> Reverts the execution if msg.sender is not the Guardian.

#### Declaration
```solidity
  function enforceCallerGuardian(
  ) internal
```

#### Modifiers:
No modifiers



### enforceSystemNotPaused
Helper function to block any action while the system is paused

> Reverts the execution if the system is paused

#### Declaration
```solidity
  function enforceSystemNotPaused(
  ) internal
```

#### Modifiers:
No modifiers



### enforceHasContractCode
Helper function to check for contract code at given address

> Reverts if there's no code at the given address.

#### Declaration
```solidity
  function enforceHasContractCode(
  ) internal
```

#### Modifiers:
No modifiers





