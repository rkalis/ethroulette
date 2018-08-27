# Avoiding Common Attacks
This file contains an overview of the measures I have taken to secure these contracts agains common attacks.

## Reentrancy & Cross-function Race Conditions
To avoid reentrancy I moved all value transfers to the end of the functions, after all internal work has already finished. Besides, all sends to untrusted addresses are done using .transfer(), instead of .call.value()().

This does not necessarily hold true for the interactions between BackedToken and BackingContract, since these call eachothers payable functions, allowing them to possibly execute code and exploit these vulnerabilities. However, it is assumed that these two contracts are linked by their creator at the start of their lifetimes, and they are considered trusted contracts to eachother.

## Integer Overflow & Underflow
Across all contracts, I used OpenZeppelin's SafeMath library, which makes sure that overflows and underflows can not occur.
