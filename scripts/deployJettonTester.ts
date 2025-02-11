import { address, toNano } from '@ton/core';
import { JettonTester } from '../wrappers/JettonTester';
import { compile, NetworkProvider } from '@ton/blueprint';
import { jettonContentToCell, jettonMinterConfigToCell } from '../wrappers/JettonMinter'
import { JettonWallet, jettonWalletConfigToCell } from '../wrappers/JettonWallet'

export async function run(provider: NetworkProvider) {
    const jmc = await compile('JettonMinter')
    const jwc = await compile('JettonWallet')
    const content = jettonContentToCell({type:1, uri:"https://raw.githubusercontent.com/X1ag/dywe-manifest/refs/heads/main/jettontester.json?token=GHSAT0AAAAAACWRHBR5C7FITPWU7PGR45EOZ5HONKA"}) // I GUESS IT IS NOT WORKING BECAUSE I POST BAD DATA. CHECK THIS PLS 
    const minter_data = jettonMinterConfigToCell({
            admin: address("UQCCUre08Opa3u2OkALTHcb0dboE-FUnkyoOqJVTO1h5HCKF"), 
            content: content,
            wallet_code: jwc
        });
    
    const jettonTester = provider.open(JettonTester.createFromConfig({jmc:jmc, jwc:jwc, data:minter_data}, await compile('JettonTester')));

    await jettonTester.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonTester.address);

    // run methods on `jettonTester`
}
