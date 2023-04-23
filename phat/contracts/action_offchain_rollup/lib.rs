#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub use crate::action_offchain_rollup::*;

#[ink::contract(env = pink_extension::PinkEnvironment)]
mod action_offchain_rollup {
    use alloc::{format, string::String, vec, vec::Vec};
    use ink::storage::traits::StorageLayout;
    use pink_extension as pink;
    use pink_extension::chain_extension::signing;
    use pink_web3::types::{H160, U256};
    use scale::{Decode, Encode};

    // To enable `(result).log_err("Reason")?`
    use pink::ResultExt;

    use phat_js as js;
    use phat_offchain_rollup::{clients::evm::EvmRollupClient, Action};

    // Defined in TestLensOracle.sol
    const TYPE_RESPONSE: u32 = 0;
    const TYPE_ERROR: u32 = 2;

    #[ink(storage)]
    pub struct ActionOffchainRollup {
        owner: AccountId,
        config: Option<Config>,
        client_config: Option<ClientConfig>,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    struct Config {
        /// Key for signing the rollup tx.
        attest_key: [u8; 32],
        /// AccountContract address to ask for tx signing
        account_contract: AccountId,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    struct ClientConfig {
        /// The RPC endpoint of the target blockchain
        rpc: String,
        /// The client smart contract address on the target blockchain
        anchor_addr: [u8; 20],
        /// Lens api url
        lens_api: String,
        /// Data transform function in Javascript
        transform_js: String,
    }

    #[derive(Encode, Decode, Debug)]
    #[repr(u8)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        BadOrigin,
        NotConfigured,
        ClientNotConfigured,
        DuplicatedConfigure,

        InvalidKeyLength,
        InvalidAddressLength,
        NoRequestInQueue,
        FailedToCreateClient,
        FailedToCommitTx,
        FailedToFetchLensApi,

        FailedToGetStorage,
        FailedToCreateTransaction,
        FailedToSendTransaction,
        FailedToGetBlockHash,
        FailedToDecode,
        InvalidRequest,
    }

    impl From<Error> for U256 {
        fn from(err: Error) -> U256 {
            (err as u8).into()
        }
    }

    type Result<T> = core::result::Result<T, Error>;

    impl ActionOffchainRollup {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {
                owner: Self::env().caller(),
                config: None,
                client_config: None,
            }
        }

        /// Gets the owner of the contract
        #[ink(message)]
        pub fn owner(&self) -> AccountId {
            self.owner
        }

        /// Configures the rollup target (admin only)
        #[ink(message)]
        pub fn config(&mut self, account_contract: AccountId) -> Result<()> {
            self.ensure_owner()?;
            if !self.config.is_none() {
                return Err(Error::DuplicatedConfigure);
            }

            const NONCE: &[u8] = b"attest_key";
            let random = signing::derive_sr25519_key(NONCE);
            self.config = Some(Config {
                attest_key: random[..32].try_into().or(Err(Error::InvalidKeyLength))?,
                account_contract,
            });
            Ok(())
        }

        /// Configures the rollup target (admin only)
        #[ink(message)]
        pub fn config_client(
            &mut self,
            rpc: String,
            anchor_addr: Vec<u8>,
            lens_api: String,
            transform_js: String,
        ) -> Result<()> {
            self.ensure_owner()?;
            self.client_config = Some(ClientConfig {
                rpc,
                anchor_addr: anchor_addr
                    .try_into()
                    .or(Err(Error::InvalidAddressLength))?,
                lens_api,
                transform_js,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn get_transform_js(&self) -> Result<String> {
            let client_config = self.ensure_client_configured()?;
            Ok(client_config.transform_js.clone())
        }

        /// Transfers the ownership of the contract (admin only)
        #[ink(message)]
        pub fn transfer_ownership(&mut self, new_owner: AccountId) -> Result<()> {
            self.ensure_owner()?;
            self.owner = new_owner;
            Ok(())
        }

        #[ink(message)]
        pub fn fetch_lens_api_stats(&self, profile_id: String) -> Result<u128> {
            let client_config = self.ensure_client_configured()?;

            let headers = vec![("Content-Type".into(), "application/json".into())];
            let body = format!("{{\"query\":\"\\n          query Profile {{\\n            profile(request: {{ profileId: \\\"{profile_id}\\\" }}) {{\\n              stats {{\\n                totalFollowers\\n                totalFollowing\\n                totalPosts\\n                totalComments\\n                totalMirrors\\n                totalPublications\\n                totalCollects\\n              }}\\n            }}\\n          }}\\n          \"}}");

            let resp = pink::http_post!(client_config.lens_api.clone(), body.as_bytes(), headers);
            if resp.status_code != 200 {
                pink::info!(
                    "Status code: {}, reason: {}, body: {:?}",
                    resp.status_code,
                    resp.reason_phrase,
                    resp.body
                );
                return Err(Error::FailedToFetchLensApi);
            }

            let resp_body = String::from_utf8(resp.body).or(Err(Error::FailedToDecode))?;
            pink::info!("Lens response: {}", resp_body);
            let res = js::eval(client_config.transform_js.as_str(), &[resp_body]);
            pink::info!("Receive Lens Api: {:?}", res);

            Ok(233)
        }

        /// Processes a Lens Api stat request by a rollup transaction
        #[ink(message)]
        pub fn answer_request(&self) -> Result<Option<Vec<u8>>> {
            use ethabi::Token;
            let config = self.ensure_configured()?;
            let client_config = self.ensure_client_configured()?;

            let mut client = connect(&client_config)?;
            let action = match self.answer_request_inner(&mut client)? {
                PriceReponse::Response(rid, res) => ethabi::encode(&[
                    Token::Uint(TYPE_RESPONSE.into()),
                    Token::Uint(rid),
                    Token::Uint(res.into()),
                ]),
                PriceReponse::Error(rid, error) => ethabi::encode(&[
                    Token::Uint(TYPE_ERROR.into()),
                    Token::Uint(rid.unwrap_or_default()),
                    Token::Uint(error.into()),
                ]),
            };
            client.action(Action::Reply(action));
            maybe_submit_tx(client, &config)
        }

        // /// Feeds a price data point to a customized rollup target.
        // ///
        // /// For dev purpose.
        // #[ink(message)]
        // pub fn feed_custom_price(
        //     &self,
        //     rpc: String,
        //     anchor_addr: [u8; 20],
        //     attest_key: [u8; 32],
        //     sender_key: Option<[u8; 32]>,
        //     feed_id: u32,
        //     price: u128,
        // ) -> Result<Option<Vec<u8>>> {
        //     use ethabi::Token;
        //     let custom_config = ClientConfig {
        //         rpc,
        //         anchor_addr,
        //         attest_key,
        //         sender_key,
        //         token0: Default::default(),
        //         token1: Default::default(),
        //         feed_id,
        //     };
        //     let mut client = connect(&custom_config)?;
        //     let payload = ethabi::encode(&[
        //         Token::Uint(TYPE_FEED.into()),
        //         Token::Uint(feed_id.into()),
        //         Token::Uint(price.into()),
        //     ]);
        //     client.action(Action::Reply(payload));
        //     maybe_submit_tx(client, &custom_config)
        // }

        fn answer_request_inner(&self, client: &mut EvmRollupClient) -> Result<PriceReponse> {
            use ethabi::{ParamType, Token};
            use pink_kv_session::traits::QueueSession;
            // Get a request if presents
            let raw_req = client
                .session()
                .pop()
                .log_err("answer_request: failed to read queue")
                .or(Err(Error::FailedToGetStorage))?
                .ok_or(Error::NoRequestInQueue)?;
            // Decode the queue data by ethabi (u256, bytes)
            let Ok(decoded) = ethabi::decode(&[ParamType::Uint(32), ParamType::Bytes], &raw_req) else {
                return Ok(PriceReponse::Error(None, Error::FailedToDecode))
            };
            let [Token::Uint(rid), Token::Bytes(profile_id)] = decoded.as_slice() else {
                return Err(Error::FailedToDecode);
            };
            let profile_id = String::from_utf8_lossy(&profile_id);
            pink::info!("Request received: ({profile_id})");
            // Get the price and respond as a rollup action.
            let result = self.fetch_lens_api_stats(String::from(profile_id));
            match result {
                Ok(res) => {
                    // Respond
                    pink::info!("Precessed result: {res}");
                    Ok(PriceReponse::Response(*rid, res))
                }
                // Error when fetching the price. Could be
                Err(Error::FailedToDecode) => {
                    Ok(PriceReponse::Error(Some(*rid), Error::FailedToDecode))
                }
                Err(e) => return Err(e),
            }
        }

        /// Returns BadOrigin error if the caller is not the owner
        fn ensure_owner(&self) -> Result<()> {
            if self.env().caller() == self.owner {
                Ok(())
            } else {
                Err(Error::BadOrigin)
            }
        }

        /// Returns the config reference or raise the error `NotConfigured`
        fn ensure_configured(&self) -> Result<&Config> {
            self.config.as_ref().ok_or(Error::NotConfigured)
        }

        /// Returns the client config reference or raise the error `NotConfigured`
        fn ensure_client_configured(&self) -> Result<&ClientConfig> {
            self.client_config
                .as_ref()
                .ok_or(Error::ClientNotConfigured)
        }
    }

    enum PriceReponse {
        Response(U256, u128),
        Error(Option<U256>, Error),
    }

    fn connect(client_config: &ClientConfig) -> Result<EvmRollupClient> {
        let anchor_addr: H160 = client_config.anchor_addr.into();
        EvmRollupClient::new(&client_config.rpc, anchor_addr)
            .log_err("failed to create rollup client")
            .or(Err(Error::FailedToCreateClient))
    }

    fn maybe_submit_tx(client: EvmRollupClient, config: &Config) -> Result<Option<Vec<u8>>> {
        use pink_web3::keys::pink::KeyPair;
        let maybe_submittable = client
            .commit()
            .log_err("failed to commit")
            .or(Err(Error::FailedToCommitTx))?;
        if let Some(submittable) = maybe_submittable {
            let attest_pair = KeyPair::from(config.attest_key);
            let tx_id = submittable
                .submit_meta_tx(&attest_pair, config.account_contract)
                .log_err("failed to submit rollup meta-tx")
                .or(Err(Error::FailedToSendTransaction))?;
            return Ok(Some(tx_id));
        }
        Ok(None)
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        struct EnvVars {
            rpc: String,
            attest_key: Vec<u8>,
            sender_key: Option<Vec<u8>>,
            anchor: Vec<u8>,
        }

        fn get_env(key: &str) -> String {
            std::env::var(key).expect("env not found")
        }
        fn config() -> EnvVars {
            dotenvy::dotenv().ok();
            let rpc = get_env("RPC");
            let attest_key = hex::decode(get_env("ATTEST_KEY")).expect("hex decode failed");
            let sender_key = std::env::var("SENDER_KEY")
                .map(|s| hex::decode(s).expect("hex decode failed"))
                .ok();
            let anchor = hex::decode(get_env("ANCHOR")).expect("hex decode failed");
            EnvVars {
                rpc,
                attest_key,
                sender_key,
                anchor,
            }
        }

        // #[ink::test]
        // fn fixed_parse() {
        //     let _ = env_logger::try_init();
        //     pink_extension_runtime::mock_ext::mock_all_ext();
        //     let p = ActionOffchainRollup::fetch_coingecko_price("polkadot", "usd").unwrap();
        //     pink::warn!("Price: {p:?}");
        // }

        // #[ink::test]
        // #[ignore]
        // fn submit_price_feed() {
        //     let _ = env_logger::try_init();
        //     pink_extension_runtime::mock_ext::mock_all_ext();
        //     let EnvVars {
        //         rpc,
        //         attest_key,
        //         sender_key,
        //         anchor,
        //     } = config();

        //     let mut price_feed = ActionOffchainRollup::default();
        //     price_feed
        //         .config(
        //             rpc,
        //             anchor,
        //             attest_key,
        //             sender_key,
        //             "polkadot".to_string(),
        //             "usd".to_string(),
        //             0,
        //         )
        //         .unwrap();

        //     let r = price_feed.feed_price().expect("failed to feed price");
        //     pink::warn!("feed price: {r:?}");
        // }

        // #[ink::test]
        // #[ignore]
        // fn answer_price_request() {
        //     let _ = env_logger::try_init();
        //     pink_extension_runtime::mock_ext::mock_all_ext();
        //     let EnvVars {
        //         rpc,
        //         attest_key,
        //         sender_key,
        //         anchor,
        //     } = config();

        //     let mut price_feed = ActionOffchainRollup::default();
        //     price_feed
        //         .config(
        //             rpc,
        //             anchor,
        //             attest_key,
        //             sender_key,
        //             "polkadot".to_string(),
        //             "usd".to_string(),
        //             0,
        //         )
        //         .unwrap();

        //     let r = price_feed.answer_price().expect("failed to answer price");
        //     pink::warn!("answer price: {r:?}");
        // }
    }
}
