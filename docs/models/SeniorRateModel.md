# SeniorRateModel





## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Globals](#globals)
- [Functions](#functions)
  - [getRates](#getrates)
  - [getUpsideExposureRate](#getupsideexposurerate)
  - [getDownsideProtectionRate](#getdownsideprotectionrate)
  - [calcRateSum](#calcratesum)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Globals

> Note this contains internal vars as well due to a bug in the docgen procedure

| Var | Type |
| --- | --- |
| scaleFactor | uint256 |
| m1 | uint256 |
| b1 | uint256 |
| m2 | uint256 |
| b2 | uint256 |
| splitPoint | uint256 |
| maxProtectionPercentage | uint256 |
| maxProtectionAbsolute | uint256 |



## Functions

### getRates
No description


#### Declaration
```solidity
  function getRates(
    uint256 juniorLiquidity,
    uint256 seniorLiquidity
  ) external returns (uint256, uint256)
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`juniorLiquidity` | uint256 | The total amount of junior liquidity in the pool
|`seniorLiquidity` | uint256 | The total amount of senior liquidity in the pool

#### Returns:
| Type | Description |
| --- | --- |
|`The` | upside exposure rate and downside protection rate scaled by `scaleFactor`
### getUpsideExposureRate
Get the upside exposure rate based on the current pool conditions



#### Declaration
```solidity
  function getUpsideExposureRate(
    uint256 juniorLiquidity,
    uint256 seniorLiquidity
  ) external returns (uint256)
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`juniorLiquidity` | uint256 | The total amount of junior liquidity in the pool
|`seniorLiquidity` | uint256 | The total amount of senior liquidity in the pool

#### Returns:
| Type | Description |
| --- | --- |
|`uint256` | The upside exposure rate, scaled by `scaleFactor`
### getDownsideProtectionRate
Get the downside protection rate based on the current pool conditions



#### Declaration
```solidity
  function getDownsideProtectionRate(
    uint256 juniorLiquidity,
    uint256 seniorLiquidity
  ) public returns (uint256)
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`juniorLiquidity` | uint256 | The total amount of junior liquidity in the pool
|`seniorLiquidity` | uint256 | The total amount of senior liquidity in the pool

#### Returns:
| Type | Description |
| --- | --- |
|`uint256` | The downside protection rate, scaled by `scaleFactor`
### calcRateSum
Calculate the sum of upside exposure rate and downside protection rate as illustrated in the chart below

     sum ▲
         │
         │
    1.0 ─┤x
        ─┤   x
    0.8 ─┤  .  x  .  .  .  .  .  .  .  .  .  .  x
        ─┤       x               x              .
    0.6 ─┤  .  .  . x                           .
        ─┤          .                           .
        ─┤          .                           .
        ─┤          .                           .
        ─┤          .                           .
        ─┤          .                           .
         └──┬───┬───┬───┬───┬───┬───┬───┬───┬───┬────────────►
                   0.3                         1.0     junior dominance %

> Leave this function last in the contract to circumvent a bug in the docgen procedure
    function calcRateSum(uint256 juniorLiquidity, uint256 seniorLiquidity) public pure returns (uint256) {
        uint256 total = juniorLiquidity + se

#### Declaration
```solidity
  function calcRateSum(
    uint256 juniorLiquidity,
    uint256 seniorLiquidity
  ) public returns (uint256)
```

#### Modifiers:
No modifiers

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`juniorLiquidity` | uint256 | The total amount of junior liquidity in the pool
|`seniorLiquidity` | uint256 | The total amount of senior liquidity in the pool

#### Returns:
| Type | Description |
| --- | --- |
|`uint256` | The sum available to split between protection and exposure, scaled by scaleFactor



