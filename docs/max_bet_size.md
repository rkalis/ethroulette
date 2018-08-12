I needed to know what the optimal max bet size was to balance profit, survival rate, and usability. For this, I simulated 1000/10000 bets of a roulette or coin flip game, and repeted this 10000 times. The average survival rates and ending profits are presented below.

## Classic Roulette

### After 1000 bets

| Bet size percentage | Survival rate | Average ending profit |
|---------------------|--------------:|----------------------:|
| 0.1%                | 100.00%       | 2.73%                 |
| 0.2%                | 100.00%       | 5.35%                 |
| 0.3%                | 100.00%       | 7.12%                 |
| 0.4%                | 99.99%        | 11.46%                |
| 0.5%                | 98.81%        | 14.44%                |
| 0.6%                | 95.49%        | 19.65%                |
| 0.7%                | 87.82%        | 21.10%                |
| 0.8%                | 79.68%        | 29.54%                |
| 0.9%                | 68.16%        | 33.32%                |
| 1.0%                | 56.18%        | 30.30%                |

### After 10000 bets
| Bet size percentage | Survival rate | Average ending profit |
|---------------------|--------------:|----------------------:|
| 0.1%                | 100.00%       | 32.27%                |
| 0.2%                | 98.01%        | 72.74%                |
| 0.3%                | 80.06%        | 120.22%               |
| 0.4%                | 51.91%        | 151.74%               |
| 0.5%                | 29.04%        | 306.58%               |
| 0.6%                | 13.74%        | 153.93%               |
| 0.7%                | 5.93%         | 121.54%               |
| 0.8%                | 2.11%         | -28.23%               |
| 0.9%                | 0.71%         | -48.60%               |
| 1.0%                | 0.27%         | -92.31%               |

## Coin flip with 2.5% house edge

### 1000 Bets
| Bet size percentage | Survival rate | Average ending profit |
|---------------------|--------------:|----------------------:|
| 1.0%                | 100.00%       | 13.83%                |
| 2.0%                | 99.99%        | 28.80%                |
| 3.0%                | 98.57%        | 45.25%                |
| 4.0%                | 90.81%        | 61.39%                |
| 5.0%                | 77.99%        | 99.99%                |
| 6.0%                | 62.02%        | 105.03%               |
| 7.0%                | 47.22%        | 110.55%               |
| 8.0%                | 34.39%        | 158.43%               |
| 9.0%                | 25.44%        | 186.88%               |
| 10.0%               | 18.06%        | 119.18%               |

### 10000 Bets
| Bet size percentage | Survival rate | Average ending profit |
|---------------------|--------------:|----------------------:|
| 1.0%                | 99.73%        | 248.32%               |
| 2.0%                | 83.01%        | 1041.87%              |
| 3.0%                | 49.29%        | 3960.19%              |
| 4.0%                | 22.45%        | 6411.98%              |
| 5.0%                | 8.94%         | 12450.18%             |
| 6.0%                | 2.65%         | 5331.65%              |
| 7.0%                | 0.65%         | 101.63%               |
| 8.0%                | 0.14%         | -25.17%               |
| 9.0%                | 0.02%         | -90.23%               |
| 10.0%               | 0.00%         | -90.44%               |

## Conclusions
* We see that a coin toss is more profitable, which might be because it has less chances to go bankrupt because of lower variance.
* In reality there is the possibility to fund the contract when it is running low on cash, making it possible for losing contracts to become more profitable again.
  * This makes profit slightly more important relative to survival rate.
* Users don't want to be limited in their betting too much, which makes usability more important than profit and survival rate.

For usability we want to have the max bet as high as possible, besides this, we want to balance the survival rate and profit depending on risk aversiveness.

For a Roulette contract, we place the max bet on 0.5% of the contract's balance, as this nearly guarantees survival after 1000 bets, while maximising average long term profits.

For a Coin Toss contract, we place the max bet on 2.5% of the contract's balance, as this also nearly guarantees survival after 1000 bets, while balancing long term profits with long term survivability.

In both of these cases, extra money can be invested when a contract is on a downswing.
