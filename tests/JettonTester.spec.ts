import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, address, Cell, toNano } from '@ton/core';
import { JettonTester } from '../wrappers/JettonTester';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { jettonContentToCell, JettonMinter, jettonMinterConfigToCell } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';

describe('JettonTester', () => {
    let tester_code: Cell;
    let jetton_minter_code: Cell;
    let jetton_wallet_code: Cell;
    let content: Cell;
    let jetton_data: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let notDeployer: SandboxContract<TreasuryContract>;
    let jettonTester: SandboxContract<JettonTester>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let userWallet: any;

    beforeAll(async () => {
        tester_code = await compile('JettonTester');
        jetton_minter_code = await compile('JettonMinter');
        jetton_wallet_code = await compile('JettonWallet');
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        notDeployer = await blockchain.treasury('notDeployer');
        content = jettonContentToCell({
            type: 1,
            uri: 'https://raw.githubusercontent.com/X1ag/dywe-manifest/refs/heads/main/jettontester.json?token=GHSAT0AAAAAACWRHBR42XSE2SR46QOGOZ2CZ5MFDZQ',
        });
        (jettonMinter = blockchain.openContract(
            await JettonMinter.createFromConfig(
                {
                    admin: deployer.address,
                    content: content,
                    wallet_code: jetton_wallet_code,
                },
                jetton_minter_code,
            ),
        )),
        jetton_data = jettonMinterConfigToCell({
            admin: deployer.address,
            content: content,
            wallet_code: jetton_wallet_code,
        });

        jettonTester = blockchain.openContract(
            JettonTester.createFromConfig(
                {
                    jetton_minter_code: jetton_minter_code,
                    jetton_wallet_code: jetton_wallet_code,
                    data: jetton_data,
                    jetton_minter_address: jettonMinter.address,
                },
                tester_code,
            ),
        );


            (userWallet = async (address: Address) =>
                blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(address))));
    });

    it('should deploy', async () => {
        const deployResult = await jettonTester.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonTester.address,
            deploy: true,
            success: true,
        });
    }),
        it('notdeployer will send jetton to jettontester', async () => {
            let initialTotalSupply = await jettonMinter.getTotalSupply();
            const deployerJettonWallet = await userWallet(deployer.address);
            let initialJettonBalanceDeployer = toNano('1000');
            let initialJettonBalanceNotDeployer = toNano('100');
            let mint = await jettonMinter.sendMint(
                deployer.getSender(),
                notDeployer.address,
                initialJettonBalanceNotDeployer,
                toNano('0.05'),
                toNano('1'),
            );
            const notDeployerJettonWallet = await userWallet(notDeployer.address);
            expect(await notDeployerJettonWallet.getJettonBalance()).toEqual(initialJettonBalanceDeployer);
            expect(await jettonMinter.getTotalSupply()).toEqual(initialTotalSupply + initialJettonBalanceNotDeployer);
        }),
        it('jetton tester shoud send jetton to notdeployer', async () => {}),
        it('should throw error code 201', async () => {});
});
