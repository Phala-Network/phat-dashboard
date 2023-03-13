#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub use simple_cloud_wallet::*;

#[ink::contract(env = pink::PinkEnvironment)]
mod simple_cloud_wallet {
    use alloc::{format, string::String, vec::Vec};
    use core::convert::TryInto;
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

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    struct Config {
        rpc: String,
        eth_sk: [u8; 32],
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

        #[ink(message)]
        pub fn get_rpc(&self) -> Result<String> {
            let config = self.config.as_ref().ok_or(Error::NotConfigured)?;
            Ok(config.rpc.clone())
        }

        /// Configures the transaction sending target
        #[ink(message)]
        pub fn config(&mut self, rpc: String, eth_sk: Vec<u8>) -> Result<()> {
            self.ensure_owner()?;
            self.config = Some(Config {
                rpc,
                eth_sk: eth_sk.try_into().or(Err(Error::BadPrivateKey))?,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn sign_evm_transaction(&self, tx: Vec<u8>) -> Result<Vec<u8>> {
            // TODO: access control
            let config = self.config.as_ref().ok_or(Error::NotConfigured)?;
            let phttp = PinkHttp::new(config.rpc.clone());
            let web3 = pink_web3::Web3::new(phttp);

            let sk = pink_web3::keys::pink::KeyPair::from(config.eth_sk);

            let tx: TransactionRequest =
                json::from_slice(&tx).or(Err(Error::BadUnsignedTransaction))?;
            let tx = TransactionParameters {
                to: tx.to,
                data: tx.data.unwrap_or_default(),
                ..Default::default()
            };

            let signed_tx = resolve_ready(web3.accounts().sign_transaction(tx, &sk))
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
    mod tests {
        use super::*;
        use pink_web3::types::TransactionRequest;

        struct EnvVars {
            rpc: String,
            key: Vec<u8>,
        }

        fn get_env(key: &str) -> String {
            std::env::var(key).expect("env not found")
        }
        fn config() -> EnvVars {
            dotenvy::dotenv().ok();
            let rpc = get_env("RPC");
            let key = hex::decode(get_env("PRIVKEY")).expect("hex decode failed");
            EnvVars { rpc, key }
        }

        #[ink::test]
        fn sign_transaction_works() {
            let _ = env_logger::try_init();
            pink_extension_runtime::mock_ext::mock_all_ext();

            let EnvVars { rpc, key } = config();

            let mut wallet = SimpleCloudWallet::default();
            wallet.config(rpc, key).unwrap();

            let tx: TransactionRequest = Default::default();
            let tx = json::to_vec(&tx).expect("Transaction encoding error");
            let signed_tx = wallet
                .sign_evm_transaction(tx)
                .expect("Transaction signing failed");
            println!("res: {:#?}", hex::encode(signed_tx));
        }
    }
}
