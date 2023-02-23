#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

use ink_lang as ink;

pub use action_evm_transaction::*;

#[ink::contract(env = pink::PinkEnvironment)]
mod action_evm_transaction {
    use alloc::{format, str::FromStr, string::String, vec::Vec};
    use ink_storage::traits::{PackedLayout, SpreadLayout};
    use pink_extension as pink;
    use pink_json as json;
    use pink_web3::{
        contract::tokens::Tokenize,
        transports::pink_http::PinkHttp,
        types::{Bytes, TransactionRequest},
    };
    use primitive_types::{H160, H256};
    use scale::{Decode, Encode};

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct ActionEvmTransaction {
        owner: AccountId,
        config: Option<Config>,
    }

    #[derive(Encode, Decode, Debug, PackedLayout, SpreadLayout)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink_storage::traits::StorageLayout)
    )]
    struct Config {
        rpc: String,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        BadOrigin,
        NotConfigured,
        BadAbi,
        BadParams(String),
        BadToAddress,
        BadTransaction,
        FailedToSendTransaction,
    }
    pub type Result<T> = core::result::Result<T, Error>;

    impl ActionEvmTransaction {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {
                owner: Self::env().caller(),
                config: None,
            }
        }

        /// Gets the owner of the contract
        #[ink(message)]
        pub fn owner(&self) -> AccountId {
            self.owner
        }

        /// Configures the transaction sending target
        #[ink(message)]
        pub fn config(&mut self, rpc: String) -> Result<()> {
            self.ensure_owner()?;
            self.config = Some(Config { rpc });
            Ok(())
        }

        #[ink(message)]
        pub fn build_transaction(
            &self,
            to: String,
            abi: Vec<u8>,
            func: String,
            params: Vec<Vec<u8>>,
        ) -> Result<Vec<u8>> {
            let to = H160::from_str(to.as_str()).map_err(|_| Error::BadToAddress)?;
            let abi: ethabi::Contract = json::from_slice(&abi).map_err(|_| Error::BadAbi)?;
            let data = abi
                .function(&func)
                .and_then(|function| function.encode_input(&params.into_tokens()))
                .map_err(|err| Error::BadParams(format!("{:?}", err)))?;

            let tx = TransactionRequest {
                to: Some(to),
                data: Some(Bytes(data)),
                ..Default::default()
            };
            let tx = json::to_vec(&tx).map_err(|_| Error::BadTransaction)?;

            Ok(tx)
        }

        #[ink(message)]
        pub fn maybe_send_transaction(&self, rlp: Vec<u8>) -> Result<H256> {
            let config = self.config.as_ref().ok_or(Error::NotConfigured)?;
            let phttp = PinkHttp::new(config.rpc.clone());
            let web3 = pink_web3::Web3::new(phttp);

            let tx_id = web3
                .eth()
                .send_raw_transaction(rlp.into())
                .resolve()
                .map_err(|_| Error::FailedToSendTransaction)?;
            Ok(tx_id)
        }

        /// Returns BadOrigin error if the caller is not the owner
        fn ensure_owner(&self) -> Result<()> {
            if self.env().caller() == self.owner {
                Ok(())
            } else {
                Err(Error::BadOrigin)
            }
        }
    }

    #[cfg(test)]
    mod tests {}
}
