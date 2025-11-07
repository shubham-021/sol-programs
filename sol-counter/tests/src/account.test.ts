import * as borsh from "borsh";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { COUNTER_SIZE } from "./types";

const connection = new Connection("http://127.0.0.1:8899");
const adminAccount = Keypair.generate();
const dataAccount = Keypair.generate();
const programId = new PublicKey("GDahDojimVMyDaFeJArcHSjJk81iZ1Hu6Nz74SVw9554");

jest.setTimeout(60_000);

// test('Testing account',async ()=>{
    // const account = await connection.getAccountInfo(adminAccount.publicKey);
    // expect(account).toBe(null);
// })

// test('Airdropping sol',async ()=>{
//     const signature = await connection.requestAirdrop(adminAccount.publicKey,10*LAMPORTS_PER_SOL);
//     const latestBlockHash = await connection.getLatestBlockhash();
//     await connection.confirmTransaction({signature,...latestBlockHash});
//     const balance = await connection.getBalance(adminAccount.publicKey);
//     // console.log(balance);
//     expect(balance).toBe(10*LAMPORTS_PER_SOL);
// })

test('Account initialising',async ()=>{
    let signature = await connection.requestAirdrop(adminAccount.publicKey,10*LAMPORTS_PER_SOL);
    let latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({signature , ...latestBlockHash});

    const account = await connection.getAccountInfo(adminAccount.publicKey);

    const lamports = await connection.getMinimumBalanceForRentExemption(COUNTER_SIZE);

    const instruction = SystemProgram.createAccount({
        fromPubkey: adminAccount.publicKey,
        lamports,
        space: COUNTER_SIZE,
        programId,
        newAccountPubkey: dataAccount.publicKey
    })

    // deprecated way

    // const txn = new Transaction();
    // txn.add(instruction);
    // latestBlockHash = await connection.getLatestBlockhash();
    // const exec = await connection.sendTransaction(txn , [adminAccount,dataAccount]);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const message = new TransactionMessage({
        payerKey: adminAccount.publicKey,
        recentBlockhash: blockhash,
        instructions:[instruction]
    }).compileToV0Message();


    const transaction = new VersionedTransaction(message);
    transaction.sign([adminAccount,dataAccount]);

    signature = await connection.sendTransaction(transaction);
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
    console.log(dataAccount.publicKey.toBase58());
    //GNutcDBX2E3WoC7QkQTywS1Us8vHFEf3PX5RKGnAwxHw
})