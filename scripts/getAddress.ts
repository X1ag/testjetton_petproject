import { address, Cell } from '@ton/core';
import { JettonTester } from '../wrappers/JettonTester';
import { compile, NetworkProvider } from '@ton/blueprint';
import { jettonContentToCell, jettonMinterConfigToCell } from '../wrappers/JettonMinter';

export async function run(provider: NetworkProvider) {
    const jetton_minter_code = await compile('JettonMinter');
		const jetton_wallet_code = await compile('JettonWallet');
    const content = jettonContentToCell({
        type: 1,
        uri: 'https://raw.githubusercontent.com/X1ag/dywe-manifest/refs/heads/main/jettontester.json?token=GHSAT0AAAAAACWRHBR42XSE2SR46QOGOZ2CZ5MFDZQ',
    });
    const minter_data = jettonMinterConfigToCell({
        admin: address('UQCCUre08Opa3u2OkALTHcb0dboE-FUnkyoOqJVTO1h5HCKF'),
        content: content,
        wallet_code: jetton_wallet_code,
    });
    const jetton_minter_address = address('kQAU3zc1jrbBY87hH4cUvbeSXISewJahY8lsHt2kITGMUBRU');
    const jettonTester = provider.open(
        JettonTester.createFromConfig(
            {
                jetton_minter_code: jetton_minter_code,
                data: minter_data,
                jetton_minter_address: jetton_minter_address,
                jetton_wallet_code: jetton_wallet_code,
            },
            await compile('JettonTester'),
        ),
    );
    const result = await jettonTester.getWalletAddress(jettonTester.address);

    console.log('wallet address:', result);

    // run methods on `jettonTester`
}
