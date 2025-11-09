import path from "node:path";
import * as borsh from "borsh";
import fs from "node:fs";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { LiteSVM } from "litesvm";
import { COUNTER_SIZE, CounterState, ixInit, SCHEMA } from "./types";

describe("Cal tests",()=>{
    let svm:LiteSVM;
    let programId:PublicKey;
    let dataAccount:Keypair;
    let userAccount:Keypair ;
    
    // const programPath = path.join(__dirname,"sol_calculator");
    // console.log(__dirname,__filename);

    // When you run:pnpm test , your current working directory is probably the project root, not src/.
    // thats why this fails
    // const program = fs.readFileSync("./sol_calculator.so")

    const programPath = path.join(__dirname,"sol_calculator.so");
    // console.log(programPath);
    const program = fs.readFileSync(programPath);

    beforeAll(()=>{
        svm = new LiteSVM();
        programId = PublicKey.unique();
        // svm.addProgramFromFile(programId,programPath);
        svm.addProgram(programId,program);
        dataAccount = Keypair.generate();
        userAccount = Keypair.generate();

        svm.airdrop(userAccount.publicKey,BigInt(LAMPORTS_PER_SOL));
        const lamports = svm.minimumBalanceForRentExemption(BigInt(COUNTER_SIZE));

        let instruction = SystemProgram.createAccount({
            fromPubkey: userAccount.publicKey,
            newAccountPubkey: dataAccount.publicKey,
            space: COUNTER_SIZE,
            lamports: Number(lamports),
            programId
        })

        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = svm.latestBlockhash();
        tx.sign(userAccount,dataAccount);
        svm.sendTransaction(tx);
        svm.expireBlockhash();

        // If you keep reusing the same blockhash for multiple transactions in LiteSVM:
        // All those transactions might get treated as duplicates (replays).
        // LiteSVM could skip them, thinking they’re the same transaction already processed.
        // You might see confusing test results (e.g., state not changing, but no error).
    });

    // as per contract
    // Init 0
    // Double 1
    // Half 2
    // Add 3
    // Subtract 4

    test("Init",()=>{
        // console.log("ixInit",Buffer.from(ixInit));
        // resposne --> <Buffer >

        // console.log("ixInit",Buffer.from([0]));
        // respons --> <Buffer 00>

        const instruction = new TransactionInstruction({
            programId,
            keys: [{pubkey:dataAccount.publicKey , isSigner: false ,isWritable:true}],
            data: Buffer.from([0])
            // data: Buffer.from(ixInit)
            // didnt work , gives empty buffer --> debug
        });

        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = svm.latestBlockhash();
        tx.feePayer = userAccount.publicKey;
        tx.sign(userAccount)
        const signature = svm.sendTransaction(tx);

        const updatedRawCounterState = svm.getAccount(dataAccount.publicKey);
        if(!updatedRawCounterState) throw new Error("No account found");

        const UpdatedCounterState = borsh.deserialize(SCHEMA,CounterState,Buffer.from(updatedRawCounterState.data));
        // console.log(UpdatedCounterState.count);
        expect(UpdatedCounterState.count).toBe(1);
    });

    test("Double",()=>{
        const instruction = new TransactionInstruction({
            programId,
            keys: [{pubkey:dataAccount.publicKey , isSigner: false ,isWritable:true}],
            data: Buffer.from([1])
        });

        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = svm.latestBlockhash();
        tx.feePayer = userAccount.publicKey;
        tx.sign(userAccount)
        const signature = svm.sendTransaction(tx);

        const updatedRawCounterState = svm.getAccount(dataAccount.publicKey);
        if(!updatedRawCounterState) throw new Error("No account found");

        const UpdatedCounterState = borsh.deserialize(SCHEMA,CounterState,Buffer.from(updatedRawCounterState.data));
        // console.log(UpdatedCounterState.count);
        expect(UpdatedCounterState.count).toBe(2);
    });

    test("Add",()=>{
        const instruction = new TransactionInstruction({
            programId,
            keys: [{pubkey:dataAccount.publicKey , isSigner: false ,isWritable:true}],
            data: Buffer.from([3,12,0,0,0])
        });

        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = svm.latestBlockhash();
        tx.feePayer = userAccount.publicKey;
        tx.sign(userAccount)
        const signature = svm.sendTransaction(tx);

        const updatedRawCounterState = svm.getAccount(dataAccount.publicKey);
        if(!updatedRawCounterState) throw new Error("No account found");

        const UpdatedCounterState = borsh.deserialize(SCHEMA,CounterState,Buffer.from(updatedRawCounterState.data));
        // console.log(UpdatedCounterState.count);
        expect(UpdatedCounterState.count).toBe(14);
    });

    test("Half",()=>{
        const instruction = new TransactionInstruction({
            programId,
            keys: [{pubkey:dataAccount.publicKey , isSigner: false ,isWritable:true}],
            data: Buffer.from([2])
        });

        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = svm.latestBlockhash();
        tx.feePayer = userAccount.publicKey;
        tx.sign(userAccount)
        const signature = svm.sendTransaction(tx);

        const updatedRawCounterState = svm.getAccount(dataAccount.publicKey);
        if(!updatedRawCounterState) throw new Error("No account found");

        const UpdatedCounterState = borsh.deserialize(SCHEMA,CounterState,Buffer.from(updatedRawCounterState.data));
        // console.log(UpdatedCounterState.count);
        expect(UpdatedCounterState.count).toBe(7);
    });

    test("Subtract",()=>{
        const instruction = new TransactionInstruction({
            programId,
            keys: [{pubkey:dataAccount.publicKey , isSigner: false ,isWritable:true}],
            data: Buffer.from([4,2,0,0,0])
        });

        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = svm.latestBlockhash();
        tx.feePayer = userAccount.publicKey;
        tx.sign(userAccount)
        const signature = svm.sendTransaction(tx);

        const updatedRawCounterState = svm.getAccount(dataAccount.publicKey);
        if(!updatedRawCounterState) throw new Error("No account found");

        const UpdatedCounterState = borsh.deserialize(SCHEMA,CounterState,Buffer.from(updatedRawCounterState.data));
        // console.log(UpdatedCounterState.count);
        expect(UpdatedCounterState.count).toBe(5);
    });
})