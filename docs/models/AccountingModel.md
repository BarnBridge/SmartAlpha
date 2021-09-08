# AccountingModel





## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Globals](#globals)
- [Functions](#functions)
  - [calcJuniorProfits](#calcjuniorprofits)
  - [calcSeniorProfits](#calcseniorprofits)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Globals

> Note this contains internal vars as well due to a bug in the docgen procedure

| Var | Type |
| --- | --- |
| scaleFactor | uint256 |



## Functions

### calcJuniorProfits
No description


#### Declaration
```solidity
  function calcJuniorProfits(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers



### calcSeniorProfits
Calculates the junior losses (in other words, senior profits) based on the current pool conditions

> It always returns 0 if the price went up.


#### Declaration
```solidity
  function calcSeniorProfits(
  ) public returns (uint256)
```

#### Modifiers:
No modifiers


#### Returns:
| Type | Description |
| --- | --- |
|`The` | amount, in pool tokens, that is considered loss for the juniors


