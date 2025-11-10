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
    let doubleCpiID:PublicKey;
    let doubleID:PublicKey;
    let dataAccount:Keypair;
    let userAccount:Keypair;

    const doubleCPI = path.join(__dirname,"double_cpi_prog.so");
    const double = path.join(__dirname,"double.so");
    jest.setTimeout(60_000);

    beforeAll(()=>{
        svm = new LiteSVM();

        doubleID = PublicKey.unique();
        doubleCpiID = PublicKey.unique();

        svm.addProgramFromFile(doubleID,double);
        svm.addProgramFromFile(doubleCpiID,doubleCPI);


        dataAccount = Keypair.generate();
        userAccount = Keypair.generate();

        svm.airdrop(userAccount.publicKey,BigInt(LAMPORTS_PER_SOL));

        let instruction = SystemProgram.createAccount({
            programId: doubleID,
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

    test("Init through CPI",()=>{
        const instruction = new TransactionInstruction({
            programId: doubleCpiID,
            keys:[
                {pubkey:dataAccount.publicKey,isSigner:true,isWritable:true},
                {pubkey:doubleID,isSigner:false,isWritable:false}
            ],
            data: Buffer.from([])
        })

        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = svm.latestBlockhash();
        transaction.feePayer = userAccount.publicKey;
        transaction.sign(dataAccount,userAccount);

        let signature = svm.sendTransaction(transaction);
        // console.log(signature.toString());
        svm.expireBlockhash();

        const updatedAccount = svm.getAccount(dataAccount.publicKey);
        if(!updatedAccount) throw new Error("No account found");

        const updatedAccountData = borsh.deserialize(CounterState.schema,CounterState,Buffer.from(updatedAccount.data));
        if(!updatedAccountData) throw new Error("No counter found");

        expect(updatedAccountData.count).toBe(1);
    })
});