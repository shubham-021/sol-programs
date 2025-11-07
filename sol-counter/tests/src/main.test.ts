import * as borsh from "borsh";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const adminAccount = Keypair.generate();
const dataAccount = Keypair.generate();
jest.setTimeout(60_000);

test('Testing balance',async ()=>{
    const connection = new Connection("http://127.0.0.1:8899");
    const balance = await connection.getAccountInfo(adminAccount.publicKey);
    expect(balance).toBe(null);
})

test('Airdropping sol',async ()=>{
    const connection = new Connection("http://127.0.0.1:8899");
    const txn = await connection.requestAirdrop(adminAccount.publicKey,10*LAMPORTS_PER_SOL);
    await connection.confirmTransaction(txn);
    const balance = await connection.getBalance(adminAccount.publicKey);
    // console.log(balance);
    expect(balance).toBe(10*LAMPORTS_PER_SOL);
})