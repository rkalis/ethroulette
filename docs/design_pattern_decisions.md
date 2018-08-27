# Design Decisions
This file contains an overview of all design patterns used and decisions made during the development of these contracts.

## Emergency Stop
I implemented an emergency stop on the Roulette contract, which disables new bets. I decided not to disable the Oraclize callback function or the payout functions as disabling these while bets are active would interrupt the bets that are in process which could lead to unintended results. I decided not to implement an emergency stop on the Roscoin contract as I wanted to keep centralised control to a minimum, as this casino (along with investment capabilities) should run completely decentralised and autonomously.

## Decentralisation and Autonomy
In my design I was very focussed on making the contracts as decentralised and as autonomous as possible. This is why I implemented a minimal emergency stop. This is also why I decided not to implement something like mortality or lifecycle management.

## Push over Pull
There was a lot of focus on preferring pull payments over push payments, but I felt like this went against usability, so I decided to go for push payments and automatically pay out bet winners instead of requiring players to request a withdrawal.

## Fail early and fail hard
In all smart contract functions I put a list of requires at the top to specify the requirements for the succesful completion of the functions. This reduces unnecessary code execution and saves the caller gas.

## Bets in progress
When bets are placed, it takes a few blocks to retrieve the outcome from Oraclize. During this time, the Roulette contract's balance is inflated with the money that was bet. This could allow token holders to invest/divest while the balance is temporarily inflated by large bets. This is why I decided to add a specific variable `balanceForBacking` to BackingContract, which is manually updated when a bet has been completed and when winning are paid out. This variable is also updated in the fallback function, so that accidentally received eth gets distributed amongst token holders.
