/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const VOTING_ABI = [{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getGuardianData","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];

async function getGuardiansRegisterInfo(tokenContract, startBlock, endBlock) {
    let options = {
        fromBlock: startBlock,
        toBlock: endBlock
    };

    let mapOfTransfers = {};
    let listOfRegister = [];
    try {
        let events = await tokenContract.getPastEvents('register', options);
        for (let i = events.length-1; i >= 0;i--) {
            let event = events[i];
            let guardianAddress = getDataFromTopic(event, TOPIC_FROM_ADDR);
            let currentRegisterIndex = mapOfTransfers[guardianAddress];
            if (typeof currentRegisterIndex === 'number' && isObjectNewerThanTx(listOfRegister[currentRegisterIndex], event) ) {
                continue;
            }
            let obj = generateGuardianObject(getDataFromTopic(event, TOPIC_TO_NAME), getDataFromTopic(event, TOPIC_TO_SITE), guardianAddress);

            if(typeof currentRegisterIndex === 'number') {
                listOfRegister[currentRegisterIndex] = obj;
            } else {
                mapOfTransfers[guardianAddress] = listOfRegister.length;
                listOfRegister.push(obj);
            }
        }
        return listOfRegister;
    } catch (error) {
        console.log(error);
        return [];
    }
}

const TOPIC_FROM_ADDR = 1;
const TOPIC_TO_NAME = 2;
const TOPIC_TO_SITE = 3;

function getDataFromTopic(event, i) {
    let topic = event.raw.topics[i];
    return topic;
}

function isObjectNewerThanTx(lastRegister, event) {
    return lastRegister.block > event.blockNumber ||
        (lastRegister.block > event.blockNumber && lastRegister.transactionIndex > event.transactionIndex)
}

function generateGuardianObject(name, site, guardianAddress) {
    return {
        name, site, guardianAddress
    }
}

module.exports = async function (web3, registerGuardianAddress, startBlock, endBlock) {
    let contract = await new web3.eth.Contract(VOTING_ABI, registerGuardianAddress);
    return await getGuardiansRegisterInfo(contract, startBlock, endBlock);
};
