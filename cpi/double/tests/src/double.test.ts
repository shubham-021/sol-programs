import * as borsh from "borsh";
import { LiteSVM } from "litesvm";
import fs from "node:fs"
import {
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js"
import path from "node:path";

class CounterState{
    count:number;

    constructor({count}:{count:number}){
        this.count = count;
    }

    static schema = new Map([[CounterState , {kind:"struct",fields:[["count","u32"]]}]]);
}

const space = borsh.serialize(CounterState.schema,new CounterState({count:0})).length;


describe("Double test",()=>{
    let svm:LiteSVM;
    let programId:PublicKey;
    let dataAccount:Keypair;
    let userAccount:Keypair;

    const programPath = path.join(__dirname,"double.so");
    jest.setTimeout(60_000);

    beforeAll(()=>{
        svm = new LiteSVM();
        programId = PublicKey.unique();
        svm.addProgramFromFile(programId,programPath);

        dataAccount = Keypair.generate();
        userAccount = Keypair.generate();

        svm.airdrop(userAccount.publicKey,BigInt(LAMPORTS_PER_SOL));

        let instruction = SystemProgram.createAccount({
            programId,
            newAccountPubkey: dataAccount.publicKey,
            fromPubkey: userAccount.publicKey,
            space,
            lamports: Number(svm.minimumBalanceForRentExemption(BigInt(space)))
        })

        let tx = new Transaction().add(instruction);
        tx.recentBlockhash = svm.latestBlockhash();
        tx.sign(userAccount,dataAccount);
        svm.sendTransaction(tx);
        svm.expireBlockhash();
    });

    test("Testing Init , should update count to 1",()=>{
        const instruction = new TransactionInstruction({
            programId,
            keys: [
                {pubkey:dataAccount.publicKey,isSigner:true,isWritable:true}
            ],
            data: Buffer.from([])
        })

        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = svm.latestBlockhash();
        transaction.feePayer = userAccount.publicKey;
        transaction.sign(dataAccount,userAccount);
        
        let signature = svm.sendTransaction(transaction);
        svm.expireBlockhash();

        const updatedDataAccount = svm.getAccount(dataAccount.publicKey);
        if(!updatedDataAccount) throw new Error("Account not found");

        const updatedCounter = borsh.deserialize(CounterState.schema,CounterState,Buffer.from(updatedDataAccount.data));
        if(!updatedCounter) throw new Error("Counter not found");

        expect(updatedCounter.count).toBe(1);
    });

    test("Testing re , should update count to 2",()=>{
        const instruction = new TransactionInstruction({
            programId,
            keys: [
                {pubkey:dataAccount.publicKey,isSigner:true,isWritable:true}
            ],
            data: Buffer.from([])
        })

        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = svm.latestBlockhash();
        transaction.feePayer = userAccount.publicKey;
        transaction.sign(dataAccount,userAccount);

        let signature = svm.sendTransaction(transaction);
        svm.expireBlockhash();

        const updatedDataAccount = svm.getAccount(dataAccount.publicKey);
        if(!updatedDataAccount) throw new Error("Account not found");

        const updatedCounter = borsh.deserialize(CounterState.schema,CounterState,Buffer.from(updatedDataAccount.data));
        if(!updatedCounter) throw new Error("Counter not found");

        expect(updatedCounter.count).toBe(2);
    });

    test("Testing re , should update count to 32",()=>{
        function double(){
            const instruction = new TransactionInstruction({
                programId,
                keys: [
                    {pubkey:dataAccount.publicKey,isSigner:true,isWritable:true}
                ],
                data: Buffer.from([])
            })

            const transaction = new Transaction().add(instruction);
            transaction.recentBlockhash = svm.latestBlockhash();
            transaction.feePayer = userAccount.publicKey;
            transaction.sign(dataAccount,userAccount);

            svm.sendTransaction(transaction);
            svm.expireBlockhash();
        }
        
        double();
        double();
        double();
        double();

        const updatedDataAccount = svm.getAccount(dataAccount.publicKey);
        if(!updatedDataAccount) throw new Error("Account not found");

        const updatedCounter = borsh.deserialize(CounterState.schema,CounterState,Buffer.from(updatedDataAccount.data));
        if(!updatedCounter) throw new Error("Counter not found");

        expect(updatedCounter.count).toBe(32);
    });
})