use::solana_program::{
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
    account_info::{
        AccountInfo,
        next_account_info
    },
    program_error::ProgramError
};
use::borsh::{BorshDeserialize,BorshSerialize};

#[derive(BorshDeserialize,BorshSerialize)]
struct CounterState{
    count: u32
}

#[derive(BorshDeserialize,BorshSerialize)]
enum Instruction{
    Init,
    Double,
    Half,
    Add{amount:u32},
    Subtract{amount:u32}
}

solana_program::entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let instruction = Instruction::try_from_slice(instruction_data)?;

    let mut iter = accounts.iter();
    let data_account = next_account_info(&mut iter)?;

    if data_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut counter_state = CounterState::try_from_slice(&data_account.data.borrow())?;

    match instruction {
        Instruction::Init => counter_state.count = 1,
        Instruction::Double => counter_state.count = counter_state.count.saturating_mul(2),
        // Multiply by 2, but if it overflows, clamp it to the maximum possible value instead of wrapping around or panicking.
        Instruction::Half => counter_state.count /= 2,
        Instruction::Add { amount } => counter_state.count = counter_state.count.saturating_add(amount),
        Instruction::Subtract { amount } => counter_state.count = counter_state.count.saturating_sub(amount),
    }

    counter_state.serialize(&mut *data_account.data.borrow_mut())?;
    Ok(())
}
