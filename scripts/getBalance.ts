import { address, Cell } from '@ton/core';
import { JettonTester } from '../wrappers/JettonTester';
import { compile, NetworkProvider } from '@ton/blueprint';
import { jettonContentToCell, jettonMinterConfigToCell } from '../wrappers/JettonMinter';

export async function run(provider: NetworkProvider) {
    const jetton_minter_code = await compile('JettonMinter');
    const jetton_wallet_boc =
        'te6ccgECDwEAA9QAART/APSkE/S88sgLAQIBYgIDAgLOBAUAG6D2BdqJofQB9IH0gahhBLNCDHAJJfBOAB0NMDAXGwjoUTXwPbPOD6QPpAMfoAMXHXIfoAMfoAMHOptAAC0x8BIIIQD4p+pbqOhTA0Wds84CCCEBeNRRm6joYwREQD2zzgNSSCEFlfB7y6gGBwgJABFPpEMMAA8uFNgAioAg1yHtRND6APpA+kDUMATTHwGCAP/wIYIQF41FGboCghB73ZfeuhKx8vTTPwEw+gAwE6BQI8hQBPoCWM8WAc8WzMntVAH2A9M/AQH6APpAIfAC7UTQ+gD6QPpA1DBRNqFSKscF8uLBKML/8uLCVDRCcFQgE1QUA8hQBPoCWM8WAc8WzMkiyMsBEvQA9ADLAMkg+QBwdMjLAsoHy//J0AT6QPQEMfoAINdJwgDy4sTIghAXjUUZAcsfUAoByz9QCPoCCgL27UTQ+gD6QPpA1DAI0z8BAfoAUVGgBfpA+kBTW8cFVHNtcFQgE1QUA8hQBPoCWM8WAc8WzMkiyMsBEvQA9ADLAMn5AHB0yMsCygfL/8nQUA3HBRyx8uLDCvoAUaihIZUQSjlfBOMNBIIImJaAtgly+wIl1wsBwwADwgATCwwC1I6ENFnbPOBsIu1E0PoA+kD6QNQwECNfAyOCEG2OXjy6jjczUiLHBfLiwYIImJaAcPsCyIAQAcsFWM8WcPoCcAHLaoIQ1TJ22wHLHwHTPwExAcs/yYEAgvsA4AOCEHaKULK64wJfA4QP8vANDgCiI88WAc8WJvoCUAfPFsnIgBgBywVQBM8WcPoCQGN3UAPLa8zMI5FykXHiUAioE6CCCkPVgKAUvPLixQTJgED7AEATyFAE+gJYzxYBzxbMye1UAHJSGqAYociCEHNi0JwByx8kAcs/UAP6AgHPFlAIzxbJyIAQAcsFJM8WUAb6AlAFcVjLaszJcfsAEDUAfLCOJsiAEAHLBVAFzxZw+gJwActqghDVMnbbAcsfUAMByz/JgQCC+wASkjMz4lADyFAE+gJYzxYBzxbMye1UAObtRND6APpA+kDUMAfTPwEB+gD6QDBRUaFSSccF8uLBJ8L/8uLCBYIJqz8AoBa88uLDyIIQe92X3gHLH1AFAcs/UAP6AiLPFgHPFsnIgBgBywUjzxZw+gIBcVjLaszJgED7AEATyFAE+gJYzxYBzxbMye1UAJZSIscF8uLB0z8BAfpA+gD0BDDIgBgBywVQA88WcPoCcMiCEA+KfqUByx9QBQHLP1j6AiTPFlAEzxb0AHD6AsoAyXFYy2rMyYBA+wA=';
    const jetton_wallet_cell = Cell.fromBoc(Buffer.from(jetton_wallet_boc, 'base64'))[0];
    const content = jettonContentToCell({
        type: 1,
        uri: 'https://raw.githubusercontent.com/X1ag/dywe-manifest/refs/heads/main/jettontester.json?token=GHSAT0AAAAAACWRHBR42XSE2SR46QOGOZ2CZ5MFDZQ',
    });
    const minter_data = jettonMinterConfigToCell({
        admin: address('UQCCUre08Opa3u2OkALTHcb0dboE-FUnkyoOqJVTO1h5HCKF'),
        content: content,
        wallet_code: jetton_wallet_cell,
    });
    const jetton_minter_address = address('kQAU3zc1jrbBY87hH4cUvbeSXISewJahY8lsHt2kITGMUBRU');
    const jettonTester = provider.open(
        JettonTester.createFromConfig(
            {
                jetton_minter_code: jetton_minter_code,
                data: minter_data,
                jetton_minter_address: jetton_minter_address,
                jetton_wallet_code: jetton_wallet_cell,
            },
            await compile('JettonTester'),
        ),
    );

    const result = await jettonTester.getBalance();

    console.log('balance is: ', result);

    // run methods on `jettonTester`
}
