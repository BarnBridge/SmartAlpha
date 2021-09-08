# OwnableERC20


Allows the owner to mint, burn and transfer tokens without requiring explicit user approval


## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Functions](#functions)
  - [constructor](#constructor)
  - [decimals](#decimals)
  - [mint](#mint)
  - [burn](#burn)
  - [transferAsOwner](#transferasowner)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->




## Functions

### constructor
No description


#### Declaration
```solidity
  function constructor(
  ) public ERC20
```

#### Modifiers:
| Modifier |
| --- |
| ERC20 |



### decimals
No description
> Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5,05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}.

#### Declaration
```solidity
  function decimals(
  ) public returns (uint8)
```

#### Modifiers:
No modifiers



### mint
Allow the owner of the contract to mint an amount of tokens to the specified user

> Only callable by owner
Emits a Transfer from the 0 address


#### Declaration
```solidity
  function mint(
    address user,
    uint256 amount
  ) public onlyOwner
```

#### Modifiers:
| Modifier |
| --- |
| onlyOwner |

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`user` | address | The address of the user to mint tokens for
|`amount` | uint256 | The amount of tokens to mint

### burn
Allow the owner of the contract to burn an amount of tokens from the specified user address

> Only callable by owner
The user's balance must be at least equal to the amount specified
Emits a Transfer to the 0 address


#### Declaration
```solidity
  function burn(
    address user,
    uint256 amount
  ) public onlyOwner
```

#### Modifiers:
| Modifier |
| --- |
| onlyOwner |

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`user` | address | The address of the user from which to burn tokens
|`amount` | uint256 | The amount of tokens to burn

### transferAsOwner
Allow the owner of the contract to transfer an amount of tokens from sender to recipient

> Only callable by owner
Acts just like transferFrom but without the allowance check


#### Declaration
```solidity
  function transferAsOwner(
    address sender,
    address recipient,
    uint256 amount
  ) public onlyOwner returns (bool)
```

#### Modifiers:
| Modifier |
| --- |
| onlyOwner |

#### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`sender` | address | The address of the account from which to transfer tokens
|`recipient` | address | The address of the account to which to transfer tokens
|`amount` | uint256 | The amount of tokens to transfer

#### Returns:
| Type | Description |
| --- | --- |
|`bool` | (always true)


