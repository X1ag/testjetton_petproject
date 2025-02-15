import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, address, beginCell, Cell, toNano } from '@ton/core';
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
        
        jettonMinter = blockchain.openContract(
            await JettonMinter.createFromConfig(
                {
                    admin: deployer.address,
                    content: content,
                    wallet_code: jetton_wallet_code,
                },
                jetton_minter_code,
            ),
        ),

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

        userWallet = async (address: Address) => blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(address)))});

    it('should deploy', async () => {
        const deployResultTester = await jettonTester.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResultTester.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonTester.address,
            deploy: true,
        });

        const deployResultMinter = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'))

        expect(deployResultMinter.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
        })
    }),

    it('notdeployer will send jetton to jettontester', async () => {
        let initialTotalSupply = await jettonMinter.getTotalSupply();
        let initialJettonBalanceNotDeployer = toNano('100');
        let inticialJettonBalanceTester = toNano('0')
        await jettonMinter.sendMint(
            deployer.getSender(),
            notDeployer.address,
            initialJettonBalanceNotDeployer,
            toNano('0.05'),
            toNano('1'),
        );
        const notDeployerJettonWallet = await userWallet(notDeployer.address);
        expect(await notDeployerJettonWallet.getJettonBalance()).toEqual(initialJettonBalanceNotDeployer);
        expect(await jettonMinter.getTotalSupply()).toEqual(initialTotalSupply + initialJettonBalanceNotDeployer);

        const forwardAmount = toNano('0.05')
        const jettonAmount = toNano("3")
        const jettonTesterJettonWallet = await userWallet(jettonTester.address);
        const transactionNotificationResult = await notDeployerJettonWallet.sendTransfer(
            notDeployer.getSender(),
            toNano('1'),
            jettonAmount,
            jettonTester.address,
            notDeployer.address,
            null,
            forwardAmount, 
            null
        )

        expect(transactionNotificationResult.transactions).toHaveTransaction({
            from: notDeployerJettonWallet.address,
            to: jettonTesterJettonWallet.address,
        })
        expect(transactionNotificationResult.transactions).toHaveTransaction({ // transfer_notification
            from: jettonTesterJettonWallet.address,
            to: jettonTester.address,
            value: forwardAmount 
        })
        expect(await notDeployerJettonWallet.getJettonBalance()).toEqual(initialJettonBalanceNotDeployer - jettonAmount);
        expect(await jettonTesterJettonWallet.getJettonBalance()).toEqual(inticialJettonBalanceTester + jettonAmount);
        expect(await jettonTester.getBalance()).toEqual(jettonAmount);
        inticialJettonBalanceTester += jettonAmount;
    }),
    it('jetton tester shoud send jetton to notdeployer', async () => {
        const notDeployerJettonWallet = await userWallet(notDeployer.address);
        const jettonTesterJettonWallet = await userWallet(jettonTester.address);
        let initialJettonBalanceNotDeployer = await notDeployerJettonWallet.getJettonBalance(); // BigInt
        let initialJettonBalanceTester = await jettonTesterJettonWallet.getJettonBalance(); 

        const forwardAmount = toNano('0.05')
        const jettonAmount = toNano("3")
        const transactionNotificationResult = await notDeployerJettonWallet.sendTransfer(
            notDeployer.getSender(),
            toNano('1'),
            jettonAmount,
            jettonTester.address,
            notDeployer.address,
            null,
            forwardAmount, 
            null
        )

        expect(transactionNotificationResult.transactions).toHaveTransaction({
            from: notDeployerJettonWallet.address,
            to: jettonTesterJettonWallet.address,
        })
        expect(transactionNotificationResult.transactions).toHaveTransaction({ // transfer_notification
            from: jettonTesterJettonWallet.address,
            to: jettonTester.address,
            value: forwardAmount 
        })
        expect(await notDeployerJettonWallet.getJettonBalance()).toEqual(initialJettonBalanceNotDeployer - jettonAmount);
        expect(await jettonTesterJettonWallet.getJettonBalance()).toEqual(initialJettonBalanceTester + jettonAmount);
        expect(await jettonTester.getBalance()).toEqual(initialJettonBalanceTester + jettonAmount);
        initialJettonBalanceTester += jettonAmount;
        initialJettonBalanceNotDeployer -= jettonAmount;
        let jettonAmountWithdraw = toNano("1");
        // ============ SEND BACK ============
        const transactionBackResult = await jettonTester.sendJettonsToUser(notDeployer.getSender(), toNano('1'), jettonAmountWithdraw);

        expect(transactionBackResult.transactions).toHaveTransaction({
            from: jettonTester.address,
            to: jettonTesterJettonWallet.address,
        })
        expect(transactionBackResult.transactions).toHaveTransaction({
            from: jettonTesterJettonWallet.address,
            to: notDeployerJettonWallet.address,
        })
        expect(await jettonTester.getBalance()).toEqual(initialJettonBalanceTester - jettonAmountWithdraw);
        expect(await notDeployerJettonWallet.getJettonBalance()).toEqual(initialJettonBalanceNotDeployer + jettonAmountWithdraw);

    }),
    it('should throw error code 201', async () => {
        const notDeployerJettonWallet = await userWallet(notDeployer.address);
        const jettonTesterJettonWallet = await userWallet(jettonTester.address);
        let initialJettonBalanceNotDeployer = await notDeployerJettonWallet.getJettonBalance(); // BigInt
        let initialJettonBalanceTester = await jettonTesterJettonWallet.getJettonBalance(); 

        const forwardAmount = toNano('0.05')
        let jettonAmount = toNano("3")
        const transactionNotificationResult = await notDeployerJettonWallet.sendTransfer(
            notDeployer.getSender(),
            toNano('1'),
            jettonAmount,
            jettonTester.address,
            notDeployer.address,
            null,
            forwardAmount, 
            null
        )

        expect(transactionNotificationResult.transactions).toHaveTransaction({
            from: notDeployerJettonWallet.address,
            to: jettonTesterJettonWallet.address,
        })
        expect(transactionNotificationResult.transactions).toHaveTransaction({ // transfer_notification
            from: jettonTesterJettonWallet.address,
            to: jettonTester.address,
            value: forwardAmount 
        })
        initialJettonBalanceNotDeployer -= jettonAmount;
        initialJettonBalanceTester += jettonAmount;
        // ======== THROW ERROR ========
        jettonAmount = initialJettonBalanceTester + toNano("100");
        const transactionBackResult = await jettonTester.sendJettonsToUser(notDeployer.getSender(), toNano('1'), jettonAmount);

        expect(transactionBackResult.transactions).toHaveTransaction({
            from: notDeployer.address,
            to: jettonTester.address,
            aborted: true,
            exitCode: 201
        })
    });
});
