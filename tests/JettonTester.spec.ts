import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { JettonTester } from '../wrappers/JettonTester';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('JettonTester', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('JettonTester');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonTester: SandboxContract<JettonTester>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        jettonTester = blockchain.openContract(JettonTester.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

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
});
