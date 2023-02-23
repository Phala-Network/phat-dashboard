#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

use ink_lang as ink;

pub use simple_cloud_wallet::*;

#[ink::contract(env = pink::PinkEnvironment)]
mod simple_cloud_wallet {
    use alloc::{format, string::String, vec::Vec};
    use core::convert::TryInto;
    use ink_storage::traits::{PackedLayout, SpreadLayout};
    use pink_extension as pink;
    use pink_json as json;
    use pink_web3::{
        transports::{pink_http::PinkHttp, resolve_ready},
        types::{TransactionParameters, TransactionRequest},
    };
    use scale::{Decode, Encode};

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct SimpleCloudWallet {
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
        eth_pk: [u8; 32],
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        BadOrigin,
        NotConfigured,
        BadPrivateKey,
        BadUnsignedTransaction,
        FailedToSignTransaction(String),
    }
    pub type Result<T> = core::result::Result<T, Error>;

    impl SimpleCloudWallet {
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
        pub fn config(&mut self, rpc: String, eth_pk: Vec<u8>) -> Result<()> {
            self.ensure_owner()?;
            self.config = Some(Config {
                rpc,
                eth_pk: eth_pk.try_into().or(Err(Error::BadPrivateKey))?,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn sign_evm_transaction(&self, tx: Vec<u8>) -> Result<Vec<u8>> {
            // TODO: access control
            let config = self.config.as_ref().ok_or(Error::NotConfigured)?;
            let phttp = PinkHttp::new(config.rpc.clone());
            let web3 = pink_web3::Web3::new(phttp);

            let pk = pink_web3::keys::pink::KeyPair::from(config.eth_pk);

            let tx: TransactionRequest =
                json::from_slice(&tx).or(Err(Error::BadUnsignedTransaction))?;
            let tx = TransactionParameters {
                to: tx.to,
                data: tx.data.unwrap_or_default(),
                ..Default::default()
            };

            let signed_tx = resolve_ready(web3.accounts().sign_transaction(tx, &pk))
                .map_err(|err| Error::FailedToSignTransaction(format!("{:?}", err)))?;

            Ok(signed_tx.raw_transaction.0)
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
