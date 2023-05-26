#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub use action_evm_transaction::*;

#[ink::contract(env = pink::PinkEnvironment)]
mod action_evm_transaction {
    use alloc::{format, str::FromStr, string::String, vec::Vec};
    use ethabi::{ParamType, Token};
    use pink_extension as pink;
    use pink_json as json;
    use pink_web3::{
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

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
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

        #[ink(message)]
        pub fn get_rpc(&self) -> Result<String> {
            let config = self.config.as_ref().ok_or(Error::NotConfigured)?;
            Ok(config.rpc.clone())
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
                .and_then(|function| {
                    let inputs = function.inputs.clone();
                    if inputs.len() != params.len() {
                        return Err(ethabi::Error::InvalidData);
                    }
                    let param_tokens: Vec<Token> = inputs
                        .iter()
                        .enumerate()
                        .map(|(i, token)| {
                            let value = match token.kind {
                                ParamType::Address => {
                                    let param: [u8; 20] = params[i].clone().try_into().unwrap();
                                    Token::Address(H160(param))
                                }
                                ParamType::Bytes => Token::Bytes(params[i].clone()),
                                // TODO: handle other types
                                _ => Token::Bytes(params[i].clone()),
                            };
                            value
                        })
                        .collect();
                    function.encode_input(&param_tokens)
                })
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
            // TODO: estimate gas before sending
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
    mod tests {
        use super::*;

        const RECEIVER_ABI: &[u8] = include_bytes!("../../res/receiver.abi.json");
        const RECEIVER_FUNC: &str = "onPhatRollupReceived";

        #[ink::test]
        fn build_transaction_works() {
            let _ = env_logger::try_init();
            pink_extension_runtime::mock_ext::mock_all_ext();

            let rpc = String::from("test.rpc");

            let mut sample_action = ActionEvmTransaction::default();
            sample_action.config(rpc).unwrap();

            let test_params = vec![[0u8; 20].to_vec(), [1u8; 32].to_vec()];
            let res = sample_action
                .build_transaction(
                    String::from("0xF8CE0975502A96e897505fd626234A9A0126C072"),
                    RECEIVER_ABI.to_vec(),
                    String::from(RECEIVER_FUNC),
                    test_params,
                )
                .unwrap();
            println!("res: {:#?}", hex::encode(res));
        }
    }
}
