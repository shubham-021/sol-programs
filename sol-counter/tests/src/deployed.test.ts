import * as borsh from "borsh"
import { Connection } from "@solana/web3.js"
import { dataAccount } from "./account.test";
import { CounterAccount, schema } from "./types";
jest.setTimeout(60_000);

const connection = new Connection("http://127.0.0.1:8899");

test("Account data value must be 0",async ()=>{
    const account = await connection.getAccountInfo(dataAccount.publicKey);
    if(!account) throw new Error("No account found");

    const counter = borsh.deserialize(schema,CounterAccount,account.data);
    console.log(counter);
    expect(counter.count).toBe(0);
})