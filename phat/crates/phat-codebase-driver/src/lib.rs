#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

use ink::primitives::{AccountId, Hash};
use scale::{Decode, Encode};
use alloc::string::String;

/// Custom error types for the contract.
/// These errors are returned to indicate specific failure cases.
#[derive(Debug, PartialEq, Eq, Encode, Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum Error {
    /// Error for unauthorized access
    BadOrigin,
    /// Error when a specific code hash is not found
    CodeNotFound,
    /// Error when uploaded code exceeds the size limit
    CodeTooLarge,
    /// Error when the total capacity for codes is exceeded
    CapacityExceeded,
}

type Result<T> = core::result::Result<T, Error>;

#[pink::driver]
#[ink::trait_definition]
pub trait PhatCodeProvider {
    /// Uploads a new piece of code.
    ///
    /// Returns the hash of the code.
    #[ink(message)]
    fn upload_code(&mut self, code: String) -> Result<Hash>;

    /// Function to associate a code as used by a contract
    /// Updates reference counts and emits events accordingly.
    ///
    /// Later `get_code` calls from the same contract will return the associated code.
    #[ink(message)]
    fn use_code(&mut self, code_hash: Hash) -> Result<()>;

    /// Retrieves the code associated with the caller's account
    /// Returns None if the caller has no associated code.
    #[ink(message)]
    fn get_code(&self) -> Option<String>;
}
