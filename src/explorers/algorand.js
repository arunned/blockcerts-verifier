import { requestWithHeader } from '../services';
import { BLOCKCHAINS, CONFIG, SUB_STEPS, TRANSACTION_APIS } from '../constants';
import { TransactionData, VerifierError } from '../models';
import { stripHashPrefix } from './utils/stripHashPrefix';
import { getText } from '../domain/i18n/useCases';
import { TRANSACTIONS_APIS_URLS } from '../constants/api';

export function getAlgoexplorerFetcher (transactionId, chain) {
  const action = 'transaction/';
  let AlgoexplorerUrl;
  if (chain === BLOCKCHAINS.algomain.code) {
    AlgoexplorerUrl = TRANSACTIONS_APIS_URLS[TRANSACTION_APIS.Algoexplorer].mainnet + action + transactionId;
  }

  if (chain === BLOCKCHAINS.algotest.code) {
    AlgoexplorerUrl = TRANSACTIONS_APIS_URLS[TRANSACTION_APIS.Algoexplorer].testnet + action + transactionId;
  }

  if (chain === BLOCKCHAINS.algobeta.code) {
    AlgoexplorerUrl = TRANSACTIONS_APIS_URLS[TRANSACTION_APIS.Algoexplorer].betanet + action + transactionId;
  }

  let getAlgoexplorerFetcher = new Promise((resolve, reject) => {
    return requestWithHeader({ url: AlgoexplorerUrl })
      .then(function (response) {

        const responseTxData = JSON.parse(response);
        try {
          let roundFetcher = getalgoexplorerRound(responseTxData, chain);
          roundFetcher
            .then(function (roundResponse) {
              const txData = parsealgoexplorerResponse(responseTxData, roundResponse);
              resolve(txData);
            })
            .catch(function () {
              reject(new VerifierError(SUB_STEPS.fetchRemoteHash, getText('errors', 'unableToGetRemoteHash')));
            });
        } catch (err) {
          // don't need to wrap this exception
          reject(new VerifierError(SUB_STEPS.fetchRemoteHash, getText('errors', 'unableToGetRemoteHash')));
        }
      }).catch(function () {
        reject(new VerifierError(SUB_STEPS.fetchRemoteHash, getText('errors', 'unableToGetRemoteHash')));
      });
  });
  return getAlgoexplorerFetcher;
}

function parsealgoexplorerResponse (jsonResponse, round) {

  const data = jsonResponse;
  const date = new Date(parseInt(round.timestamp) * 1000);
  const issuingAddress = data.from;
  const remoteHash = new Buffer(data.noteb64, 'base64').toString('ascii');

  //print the results
  console.log(remoteHash);
  console.log(issuingAddress);
  console.log(date);
  return new TransactionData(remoteHash, issuingAddress, date, undefined);
}

function getalgoexplorerRound (jsonResponse, chain) {

  const round = jsonResponse.round;

  const action = 'block/';
  let AlgoexplorerUrl;
  if (chain === BLOCKCHAINS.algomain.code) {
    AlgoexplorerUrl = TRANSACTIONS_APIS_URLS[TRANSACTION_APIS.Algoexplorer].mainnet + action + round;
  }

  if (chain === BLOCKCHAINS.algotest.code) {
    AlgoexplorerUrl = TRANSACTIONS_APIS_URLS[TRANSACTION_APIS.Algoexplorer].testnet + action + round;
  }

  if (chain === BLOCKCHAINS.algobeta.code) {
    AlgoexplorerUrl = TRANSACTIONS_APIS_URLS[TRANSACTION_APIS.Algoexplorer].betanet + action + round;
  }
  return new Promise((resolve, reject) => {
    return requestWithHeader({ url: AlgoexplorerUrl })
      .then(function (response) {

        const responseData = JSON.parse(response);

        try {
          let checkConfirmationsFetcher = checkalgoexplorerConfirmations(chain, round);
          checkConfirmationsFetcher
            .then(function () {
              resolve(responseData);
            })
            .catch(function () {
              reject(new VerifierError(SUB_STEPS.fetchRemoteHash, getText('errors', 'unableToGetRemoteHash')));
            });
        } catch (err) {
          // don't need to wrap this exception
          reject(new VerifierError(SUB_STEPS.fetchRemoteHash, getText('errors', 'unableToGetRemoteHash')));
        }
      }).catch(function () {
        reject(new VerifierError(SUB_STEPS.fetchRemoteHash, getText('errors', 'unableToGetRemoteHash')));
      });
  });
}

function checkalgoexplorerConfirmations (chain, round) {

  let AlgoexplorerUrl;
  const action = 'status';
  if (chain === BLOCKCHAINS.algomain.code) {
    AlgoexplorerUrl = TRANSACTIONS_APIS_URLS[TRANSACTION_APIS.Algoexplorer].mainnet + action
  }

  if (chain === BLOCKCHAINS.algotest.code) {
    AlgoexplorerUrl = TRANSACTIONS_APIS_URLS[TRANSACTION_APIS.Algoexplorer].testnet + action;
  }

  if (chain === BLOCKCHAINS.algobeta.code) {
    AlgoexplorerUrl = TRANSACTIONS_APIS_URLS[TRANSACTION_APIS.Algoexplorer].betanet + action;
  }

  return new Promise((resolve, reject) => {
    return requestWithHeader({ url: AlgoexplorerUrl })
      .then(function (response) {
        const responseData = JSON.parse(response);
        const currentRound = responseData.lastRound;
        try {
          if (currentRound - round < CONFIG.MininumConfirmations) {
            reject(new VerifierError(SUB_STEPS.fetchRemoteHash, getText('errors', 'checkalgoexplorerConfirmations')));
          }
          resolve(currentRound);
        } catch (err) {
          // don't need to wrap this exception
          reject(new VerifierError(SUB_STEPS.fetchRemoteHash, getText('errors', 'unableToGetRemoteHash')));
        }
      }).catch(function () {
        reject(new VerifierError(SUB_STEPS.fetchRemoteHash, getText('errors', 'unableToGetRemoteHash')));
      });
  });
}
