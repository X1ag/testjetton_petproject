import { address, Slice, toNano } from '@ton/core';
import { JettonTester } from '../wrappers/JettonTester';
import { compile, NetworkProvider } from '@ton/blueprint';
import { jettonContentToCell, jettonMinterConfigToCell } from '../wrappers/JettonMinter'

export async function run(provider: NetworkProvider) {
		const jmc = await compile('JettonMinter')
		const jwc = await compile('JettonWallet')
		const content = jettonContentToCell({type:1, uri:"https://raw.githubusercontent.com/X1ag/dywe-manifest/refs/heads/main/jettontester.json?token=GHSAT0AAAAAACWRHBR5C7FITPWU7PGR45EOZ5HONKA"})
		const data = jettonMinterConfigToCell({
						admin: address(("UQCCUre08Opa3u2OkALTHcb0dboE-FUnkyoOqJVTO1h5HCKF")), 
						content: content,
						wallet_code: jwc
				});
		
		const jettonTester = provider.open(JettonTester.createFromConfig({jmc:jmc, jwc:jwc, data:data}, await compile('JettonTester')));
		const addr = address("0QCCUre08Opa3u2OkALTHcb0dboE-FUnkyoOqJVTO1h5HJkP")
		const result = await jettonTester.getWalletAddress(addr);

		console.log('wallet address:', result);


		// run methods on `jettonTester`
}