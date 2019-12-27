/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
const Web3 = require('web3');
const fs = require('fs');
const _ = require('lodash/core');

let ethereumConnectionURL = process.env.ETHEREUM_NETWORK_URL;
let erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
let votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
let guardiansRegisterAddress = '0xD64B1BF6fCAb5ADD75041C89F61816c2B3d5E711';
let startBlock = process.env.START_BLOCK_ON_ETHEREUM;
let endBlock = process.env.END_BLOCK_ON_ETHEREUM;
let filename = process.env.OUTPUT_FILENAME;
let verbose = false;
let serverType = 'A';
let blockInterval = 100;
const TOKEN_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];


function validateInput() {
    if (process.env.VERBOSE) {
        verbose = true;
    }

    if (!ethereumConnectionURL) {

	var aaa = 0;
	if (aaa == 1) {
        	ethereumConnectionURL = "https://mainnet.infura.io/v3/f4412fd60949402b8d110443a96cd391";
		serverType='_A';
	} else {
		ethereumConnectionURL = "https://ethereum.api.nodesmith.io/v1/mainnet/jsonrpc?apiKey=2602d8756224465eaaf7022307956964";
		serverType='_B';
	}
    }

    if (!erc20ContractAddress) {
        erc20ContractAddress = '0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA';
    }

    if (!votingContractAddress) {
        votingContractAddress = '0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d';
    }

    //if (!startBlock) {
        // startBlock = '7604400';//'7420000'; // 20190417-0100
        //startBlock = '7604400';//'7420000';
	//startBlock = '7420000';//'7420000';
	startBlock = 7454500;//'7420000';
	
    //}

    //if (!endBlock) {
        //endBlock = '7580000'; //'latest';        
	//endBlock = '7621318'; //7458000
	endBlock = 7630152;
    //}
    
    blockInterval = 1000; // 500

}

function mergeEvents(transferEvents, delegateEvents) {
    let mapper = {};
    for (let i = 0;i < transferEvents.length;i++) {
        mapper[transferEvents[i].delegatorAddress] = transferEvents[i];
    }

    for (let i = 0;i < delegateEvents.length;i++) {
        mapper[delegateEvents[i].delegatorAddress] = delegateEvents[i];
    }

    return _.values(mapper);
}

async function readAndMergeEvents(web3, tokenContract, votingContractAddress, startBlock, endBlock) {
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `Reading from block ${startBlock} to block ${endBlock}`);
    }


    let transferEvents = await require('./node-scripts/findDelegateByTransferEvents')(web3, tokenContract, startBlock, endBlock);
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `Found ${transferEvents.length} Transfer events of Contract Address ${tokenContract.address}`);
    }

    let delegateEvents = await require('./node-scripts/findDelegateEvents')(web3, votingContractAddress, startBlock, endBlock);
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `Found ${delegateEvents.length} Delegate events of Contract Address ${votingContractAddress}`);
    }

    return mergeEvents(transferEvents, delegateEvents);
}

async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `VERBOSE MODE`);
    }

    let web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));
    let tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);

    let csvStr = 'Delegator,Stake,Delegatee,Method,Block,Reward\n';
    let addressStr = '';

    endBlock = await new web3.eth.getBlockNumber();
    console.log('Current Latest Height: %d', endBlock);

    //let bInterval = 100;
    let cycleNum = (endBlock - startBlock) / blockInterval;

    console.log('Total - start: %s / stop: %s / cycleNum: %s', startBlock, endBlock, cycleNum);

    if (!filename) {
        filename = 'output_' + startBlock + "_" + endBlock + serverType + ".csv";
    }

    for (let x = 0; x < cycleNum ; x++ ) {

	    endBlock = startBlock + blockInterval;

	    console.log('[%d] start: %s / stop: %s', x, startBlock, endBlock);

	    let start = startBlock + "";
	    let end = endBlock + "";

	    let results = await readAndMergeEvents(web3, tokenContract, votingContractAddress, start, end);
	    if (verbose) {
		console.log('\x1b[33m%s\x1b[0m', `Merged to ${results.length} Delegate events`);
	    }

	    for (let i = 0;i < results.length;i++) {
		    let result = results[i];
		    let stakeBN = web3.utils.toBN(await tokenContract.methods.balanceOf(result.delegatorAddress).call());
		    let mod10in16 = web3.utils.toBN('10000000000000000');
		    let stakeStr = stakeBN.div(mod10in16);
		    let tempUrl = '';
		    result.stake = parseFloat(stakeStr) / 100.0;

		    console.log('%s \x1b[34m%s\x1b[0m %s \x1b[34m%s\x1b[0m %s \x1b[35m%s\x1b[0m %s \x1b[36m%s\x1b[0m %s \x1b[32m%s\x1b[0m',
		        `Delegator`, `${result.delegatorAddress}`,
		        `delegated to`, `${result.delegateeAddress}`,
		        `with a`, `${result.method}`,
		        `at block`, `${result.block}`,
  		        `with stake`, `${result.stake}`);
		    tempUrl = `https://orbs-network.github.io/voting/reward?address=${result.delegatorAddress}`;
		    csvStr += `${result.delegatorAddress},${result.stake},${result.delegateeAddress},${result.method},${result.block},` + tempUrl + `\n`;
		    addressStr += `${result.delegatorAddress}\n`;
	    }
	    startBlock = endBlock;
    }
 
    fs.writeFileSync(filename, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `CSV version file was saved to ${filename}!`);
    
    fs.writeFileSync('addresses.txt', addressStr);
    console.log('\x1b[33m%s\x1b[0m', `CSV version file was saved to addresses.txt!`);

}

main()
    .then(results => {
        console.log('\x1b[33m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);
