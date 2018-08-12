import random
import numpy as np

starting_balance = 1000000000
bet_size_percentages = np.linspace(0.01, 0.10, 10)
bet_number = 1
turn_count = 10000
simulation_count = 10000
broke_threshold = 0.1 * starting_balance
house_edge = 0.025

for bet_size_percentage in bet_size_percentages:
    final_balances = np.array([])
    for i in range(simulation_count):
        balance = starting_balance
        for turn in range(turn_count):
            bet_size = balance * bet_size_percentage
            if (np.random.randint(2)) == bet_number:
                balance -= bet_size * (1 - house_edge)
            else:
                balance += bet_size
            if balance <= broke_threshold:
                break
        final_balances = np.append(final_balances, balance)
    print("Bet size percentage (%): ", bet_size_percentage * 100)
    print("Survival rate (%): ", np.where(final_balances > broke_threshold)[0].size / final_balances.size * 100)
    print("Average ending profit (%): ", np.mean(final_balances) / starting_balance * 100 - 100)
