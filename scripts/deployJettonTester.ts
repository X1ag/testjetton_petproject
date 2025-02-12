import { address, toNano } from '@ton/core';
import { JettonTester } from '../wrappers/JettonTester';
import { compile, NetworkProvider } from '@ton/blueprint';
import { jettonContentToCell, jettonMinterConfigToCell } from '../wrappers/JettonMinter'
import { JettonWallet, jettonWalletConfigToCell } from '../wrappers/JettonWallet'

export async function run(provider: NetworkProvider) {
    const jetton_minter_code = await compile('JettonMinter')
    const jetton_wallet_code = await compile('JettonWallet')
    const content = jettonContentToCell({type:1, uri:"https://raw.githubusercontent.com/X1ag/dywe-manifest/refs/heads/main/jettontester.json?token=GHSAT0AAAAAACWRHBR42XSE2SR46QOGOZ2CZ5MFDZQ"}) // I GUESS IT IS NOT WORKING BECAUSE I POST BAD DATA. CHECK THIS PLS 
    const minter_data = jettonMinterConfigToCell({
            admin: address("UQCCUre08Opa3u2OkALTHcb0dboE-FUnkyoOqJVTO1h5HCKF"), 
            content: content,
            wallet_code: jetton_wallet_code
        });
    
    const jettonTester = provider.open(JettonTester.createFromConfig({jmc:jetton_minter_code, jwc:jetton_wallet_code, data:minter_data}, await compile('JettonTester')));

    await jettonTester.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonTester.address);

    // run methods on `jettonTester`
}
