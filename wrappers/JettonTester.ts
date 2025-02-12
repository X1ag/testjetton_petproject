import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Slice, toNano } from '@ton/core';

import { JettonWallet } from './JettonWallet';

export type JettonTesterConfig = {
    jwc: Cell,
    jmc: Cell,
    data: Cell,
    jetton_minter_address: Address
};

export function jettonTesterConfigToCell(config: JettonTesterConfig): Cell {
    return beginCell()
                 .storeCoins(0)
                 .storeRef(config.jwc)
                 .storeRef(config.jmc)
                 .storeRef(config.data)
                 .storeAddress(config.jetton_minter_address)
         .endCell();
}

export class JettonTester implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonTester(address);
    }

    static createFromConfig(config: JettonTesterConfig, code: Cell, workchain = 0) {
        const data = jettonTesterConfigToCell(config);
        const init = { code, data };
        return new JettonTester(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendJettons(provider: ContractProvider, via: Sender, value: bigint, to: Address, from: Address, amount: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonWallet.transferMessage(amount, // jetton amount
                                                to, 
                                                from, // response address
                                                beginCell().endCell(), // custom payload
                                                toNano('0.05'), // forward ton amount
                                                beginCell().endCell()) // forward payload
        });
    }

    async sendJettonsToUser(provider: ContractProvider, via: Sender, value: bigint, amount: bigint) {
       await provider.internal(via, {
           value: value,
           sendMode: SendMode.PAY_GAS_SEPARATELY,
           body: beginCell().storeUint(0x2ff2, 32).storeUint(123, 64).storeCoins(amount).endCell()
    })
}

    async getWalletAddress(provider: ContractProvider, owner:Address) {
        const res = await provider.get('get_wallet_jetton_sc_address', [{type:"slice", cell: beginCell().storeAddress(owner).endCell()}])
        return res.stack.readAddress()
    }

    async getBalance(provider: ContractProvider) {
        const res = await provider.get('get_contract_balance', [])
        return res.stack.readBigNumber()
    }
}
