import { Web3Service } from './web3.service';
import { Injectable } from '@angular/core';
import { StatusService } from '../shared/status.service';

declare let require: any;
const roscoin_artifacts = require('../../../build/contracts/Roscoin.json');
const roulette_artifacts = require('../../../build/contracts/Roulette.json');

@Injectable()
export class ContractService {
  public contracts = {
    'Roscoin': {
      artifacts: null,
      deployed: null
    },
    'Roulette': {
      artifacts: null,
      deployed: null
    }
  };

  private _ready: Promise<any>;

  constructor(
    private web3Service: Web3Service
  ) {
    console.log(this);

    this._ready = web3Service.ready().then(() => {
      return Promise.all([
        new Promise((resolve, reject) => {
          this.web3Service.artifactsToContract(roscoin_artifacts)
          .then((RoscoinAbstraction) => {
            this.contracts.Roscoin.artifacts = RoscoinAbstraction;
            return this.contracts.Roscoin.artifacts.deployed();
          }).then((deployedRoscoin) => {
            this.contracts.Roscoin.deployed = deployedRoscoin;
            return resolve();
          }).catch((error) => reject(error));
        }),
        new Promise((resolve, reject) => {
          this.web3Service.artifactsToContract(roulette_artifacts)
          .then((RouletteAbstraction) => {
            this.contracts.Roulette.artifacts = RouletteAbstraction;
            return this.contracts.Roulette.artifacts.deployed();
          }).then((deployedRoulette) => {
            this.contracts.Roulette.deployed = deployedRoulette;
            return resolve();
          }).catch((error) => reject(error));
        })
      ]);
    });
  }

  ready(): Promise<any> {
    return this._ready;
  }

  getDeployedContract(contract: string) {
    return this.contracts[contract].deployed;
  }

  newEvent(contract: string, event: string, filter: object = {}) {
    const newEvent = this.contracts[contract].deployed[event](filter, {fromBlock: 0, toBlock: 'latest'});
    return newEvent;
  }
}
