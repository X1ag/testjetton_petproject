import { address, OpenedContract, toNano } from '@ton/core';
import { JettonTester } from '../wrappers/JettonTester';
import { compile, NetworkProvider } from '@ton/blueprint';
import { jettonContentToCell, JettonMinter, jettonMinterConfigToCell } from '../wrappers/JettonMinter'
import { JettonWallet } from '../wrappers/JettonWallet'

let minterContract: OpenedContract<JettonMinter>;
export async function run(provider: NetworkProvider) {
    let walletContract: OpenedContract<JettonWallet>;
		const	jmc = await compile('JettonMinter')
		const jwc = await compile('JettonWallet')
		const content = jettonContentToCell({type:1, uri:"https://raw.githubusercontent.com/X1ag/dywe-manifest/refs/heads/main/jettontester.json?token=GHSAT0AAAAAACWRHBR5C7FITPWU7PGR45EOZ5HONKA"})
    const data = jettonMinterConfigToCell({
        admin: address(("UQCCUre08Opa3u2OkALTHcb0dboE-FUnkyoOqJVTO1h5HCKF")), 
        content: content,
        wallet_code: jwc
    });

    const jettonMinterAddr = address('kQAU3zc1jrbBY87hH4cUvbeSXISewJahY8lsHt2kITGMUBRU'); 

    const jettonTester = provider.open(JettonTester.createFromConfig({jmc:jmc, jwc:jwc, data:data}, await compile('JettonTester')));

    minterContract = provider.open(JettonMinter.createFromAddress(jettonMinterAddr));

    const result = await minterContract.getWalletAddress(jettonTester.address);

    console.log('wallet address: ', result);



    await jettonTester.sendJettons(provider.sender(), toNano('0.1'), jettonTester.address, provider.sender().address!, toNano(1));


		console.log('tx was sent');
}