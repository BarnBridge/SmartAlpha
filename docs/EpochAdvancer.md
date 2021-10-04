# EpochAdvancer





## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Globals](#globals)
- [Functions](#functions)
  - [constructor](#constructor)
  - [addPool](#addpool)
  - [addPools](#addpools)
  - [advanceEpochs](#advanceepochs)
  - [checkUpkeep](#checkupkeep)
  - [performUpkeep](#performupkeep)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Globals

> Note this contains internal vars as well due to a bug in the docgen procedure

| Var | Type |
| --- | --- |
| pools | address[] |
| numberOfPools | uint256 |



## Functions

### constructor
No description


#### Declaration
```solidity
  function constructor(
  ) public
```

#### Modifiers:
No modifiers



### addPool
No description


#### Declaration
```solidity
  function addPool(
  ) public onlyOwner
```

#### Modifiers:
| Modifier |
| --- |
| onlyOwner |



### addPools
No description


#### Declaration
```solidity
  function addPools(
  ) public onlyOwner
```

#### Modifiers:
| Modifier |
| --- |
| onlyOwner |



### advanceEpochs
No description


#### Declaration
```solidity
  function advanceEpochs(
  ) public
```

#### Modifiers:
No modifiers



### checkUpkeep
No description


#### Declaration
```solidity
  function checkUpkeep(
  ) external returns (bool, bytes)
```

#### Modifiers:
No modifiers



### performUpkeep
No description


#### Declaration
```solidity
  function performUpkeep(
  ) external
```

#### Modifiers:
No modifiers





