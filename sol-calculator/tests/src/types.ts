import * as borsh from "borsh";

class CounterState{count:number; constructor({count}:{count:number}){this.count=count}};
class Init{};
class Double{};
class Half{};
class Add{amount:number; constructor({amount}:{amount:number}){this.amount = amount}}
class Subtract{amount:number; constructor({amount}:{amount:number}){this.amount = amount}}

const SCHEMA = new Map<any,any>([
    [CounterState , {kind:"struct",fields:[["count","u32"]]}],
    [Init, {kind:"struct",fields:[]}],
    [Half, {kind:"struct",fields:[]}],
    [Double, {kind:"struct",fields:[]}],
    [Add, {kind:"struct",fields:[["amount","u32"]]}],
    [Subtract, {kind:"struct",fields:[["amount","u32"]]}],
]);

const COUNTER_SIZE = borsh.serialize(SCHEMA , new CounterState({count:0})).length;
const ixInit = borsh.serialize(SCHEMA,new Init());
const ixHalf = borsh.serialize(SCHEMA,new Half());
const ixDouble = borsh.serialize(SCHEMA,new Double());
const ixAdd = borsh.serialize(SCHEMA,new Add({amount:10}));
const ixSubtract = borsh.serialize(SCHEMA,new Subtract({amount:5}));

export {
    SCHEMA,
    COUNTER_SIZE,
    CounterState,
    ixAdd,
    ixDouble,
    ixInit,
    ixSubtract,
    ixHalf
};