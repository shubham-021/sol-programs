import * as borsh from "borsh";

export class CounterAccount{
    count:number;

    constructor({count}:{count:number}){
        this.count = count;
    }
}

export const schema = new Map([[CounterAccount , {kind:"struct",fields:[["count","u32"]]}]]);

export const COUNTER_SIZE = borsh.serialize(schema , new CounterAccount({count:0})).length;

// console.log(COUNTER_SIZE); // --> 4

// console.log(borsh.serialize(schema , new CounterAccount({count:0})));
// <Buffer 00 00 00 00>
// console.log(borsh.serialize(schema , new CounterAccount({count:1})));
// <Buffer 01 00 00 00>
// console.log(borsh.serialize(schema , new CounterAccount({count:10})));
// <Buffer 0a 00 00 00>