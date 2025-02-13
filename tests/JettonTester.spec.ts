import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { address, Cell, toNano } from '@ton/core';
import { JettonTester } from '../wrappers/JettonTester';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { jettonContentToCell, jettonMinterConfigToCell } from '../wrappers/JettonMinter'

describe('JettonTester', () => {
    let code: Cell;
    let jetton_minter_code: Cell;
    let jetton_wallet_code: Cell;
    let jetton_content: Cell;
    beforeAll(async () => {
        code = await compile('JettonTester');
        jetton_minter_code = await compile('JettonMinter');
        jetton_wallet_code = await compile('JettonWallet');
        jetton_content = jettonMinterConfigToCell({ admin: address(("UQCCUre08Opa3u2OkALTHcb0dboE-FUnkyoOqJVTO1h5HCKF")), 
                    content: jettonContentToCell({type:1, uri:"https://raw.githubusercontent.com/X1ag/dywe-manifest/refs/heads/main/jettontester.json?token=GHSAT0AAAAAACWRHBR5C7FITPWU7PGR45EOZ5HONKA"}),
                    wallet_code: jetton_wallet_code 
                });
        
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let notDeployer: SandboxContract<TreasuryContract>;
    let jettonTester: SandboxContract<JettonTester>;


    beforeEach(async () => {
        blockchain = await Blockchain.create();

        const jetton_minter_address = address("kQAU3zc1jrbBY87hH4cUvbeSXISewJahY8lsHt2kITGMUBRU")
	    const jettonTester = blockchain.openContract(JettonTester.createFromConfig({jmc:jetton_minter_code, jwc:jetton_wallet_code, data:jetton_content, jetton_minter_address:jetton_minter_address}, await compile('JettonTester')));
        deployer = await blockchain.treasury('deployer');
        notDeployer = await blockchain.treasury('notDeployer');

        const deployResult = await jettonTester.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonTester.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonTester are ready to use
    });
    it("notdeployer will send jetton to jettontester", async () => {
        // const 
    }) 
});
