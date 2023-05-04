#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub use crate::action_offchain_rollup::*;

#[ink::contract(env = pink_extension::PinkEnvironment)]
mod action_offchain_rollup {
    use alloc::{format, string::String, vec, vec::Vec};
    use ink::env::call::{build_call, ExecutionInput, Selector};
    use ink::storage::traits::StorageLayout;
    use pink_extension as pink;
    use pink_extension::chain_extension::signing;
    use pink_web3::{
        api::{Eth, Namespace},
        signing::Key,
        transports::{resolve_ready, PinkHttp},
        types::{H160, U256},
    };
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

    #[derive(Encode, Decode, Debug, PartialEq)]
    #[repr(u8)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        BadOrigin,
        NotConfigured,
        ClientNotConfigured,
        DuplicatedConfigure,
        BadAccountContract,

        InvalidKeyLength,
        InvalidAddressLength,
        NoRequestInQueue,
        FailedToCreateClient,
        FailedToCommitTx,

        BadProfileId,
        FailedToFetchLensApi,
        FailedToTransformLensData,
        BadTransformedData,

        FailedToGetStorage,
        FailedToCreateTransaction,
        FailedToSignTransaction,
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

        /// Configures the account contract (admin only)
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

        #[ink(message)]
        pub fn get_attest_address(&self) -> Result<H160> {
            let config = self.ensure_configured()?;
            let sk = pink_web3::keys::pink::KeyPair::from(config.attest_key);
            Ok(sk.address())
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

        /// admin only
        #[ink(message)]
        pub fn get_transform_js(&self) -> Result<String> {
            self.ensure_owner()?;
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

            // profile_id should be like 0x0001
            let is_hex_digit = |n| char::is_digit(n, 16);
            if !profile_id.starts_with("0x") || !profile_id[2..].chars().all(is_hex_digit) {
                return Err(Error::BadProfileId);
            }

            let headers = vec![("Content-Type".into(), "application/json".into())];
            let body = format!("{{\"query\":\"\\n          query Profile {{\\n            profile(request: {{ profileId: \\\"{profile_id}\\\" }}) {{\\n              stats {{\\n                totalFollowers\\n                totalFollowing\\n                totalPosts\\n                totalComments\\n                totalMirrors\\n                totalPublications\\n                totalCollects\\n              }}\\n            }}\\n          }}\\n          \"}}");

            let resp = pink::http_post!(client_config.lens_api.clone(), body.as_bytes(), headers);
            if resp.status_code != 200 {
                pink::warn!(
                    "Fail to read Lens api withstatus code: {}, reason: {}, body: {:?}",
                    resp.status_code,
                    resp.reason_phrase,
                    resp.body
                );
                return Err(Error::FailedToFetchLensApi);
            }

            let resp_body = String::from_utf8(resp.body).or(Err(Error::FailedToDecode))?;
            let result = js::eval(client_config.transform_js.as_str(), &[resp_body])
                .map_err(|_| Error::FailedToTransformLensData)?;

            let result_num: u128 = match result {
                phat_js::Output::String(result_str) => {
                    result_str.parse().map_err(|_| Error::BadTransformedData)?
                }
                phat_js::Output::Bytes(_) => {
                    return Err(Error::BadTransformedData);
                }
            };

            Ok(result_num)
        }

        /// Processes a Lens Api stat request by a rollup transaction
        #[ink(message)]
        pub fn answer_request(&self) -> Result<Option<Vec<u8>>> {
            use ethabi::Token;
            let config = self.ensure_configured()?;
            let client_config = self.ensure_client_configured()?;

            let mut client = connect(&client_config)?;
            let action = match self.answer_request_inner(&mut client)? {
                LensResponse::Response(rid, res) => ethabi::encode(&[
                    Token::Uint(TYPE_RESPONSE.into()),
                    Token::Uint(rid),
                    Token::Uint(res.into()),
                ]),
                LensResponse::Error(rid, error) => ethabi::encode(&[
                    Token::Uint(TYPE_ERROR.into()),
                    Token::Uint(rid.unwrap_or_default()),
                    Token::Uint(error.into()),
                ]),
            };
            client.action(Action::Reply(action));
            maybe_submit_tx(client, &config, client_config.rpc.clone())
        }

        fn answer_request_inner(&self, client: &mut EvmRollupClient) -> Result<LensResponse> {
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
                return Ok(LensResponse::Error(None, Error::FailedToDecode))
            };
            let [Token::Uint(rid), Token::Bytes(profile_id)] = decoded.as_slice() else {
                return Err(Error::FailedToDecode);
            };
            let profile_id = String::from_utf8_lossy(&profile_id);
            pink::info!("Request received for profile {profile_id}");

            // Get the Lens stats and respond as a rollup action.
            let result = self.fetch_lens_api_stats(String::from(profile_id));
            match result {
                Ok(res) => {
                    // Respond
                    pink::info!("Precessed result: {res}");
                    Ok(LensResponse::Response(*rid, res))
                }
                // Error when fetching the stats. Could be
                Err(Error::FailedToDecode) => {
                    Ok(LensResponse::Error(Some(*rid), Error::FailedToDecode))
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

    enum LensResponse {
        Response(U256, u128),
        Error(Option<U256>, Error),
    }

    fn connect(client_config: &ClientConfig) -> Result<EvmRollupClient> {
        let anchor_addr: H160 = client_config.anchor_addr.into();
        EvmRollupClient::new(&client_config.rpc, anchor_addr)
            .log_err("failed to create rollup client")
            .or(Err(Error::FailedToCreateClient))
    }

    fn maybe_submit_tx(
        client: EvmRollupClient,
        config: &Config,
        rpc: String,
    ) -> Result<Option<Vec<u8>>> {
        use pink_web3::keys::pink::KeyPair;
        let maybe_submittable = client
            .commit()
            .log_err("failed to commit")
            .or(Err(Error::FailedToCommitTx))?;
        if let Some(submittable) = maybe_submittable {
            // get AccountContract info
            let from_address = build_call::<pink::PinkEnvironment>()
                .call(config.account_contract)
                .transferred_value(0)
                .exec_input(ExecutionInput::new(Selector::new(ink::selector_bytes!(
                    "get_current_evm_account_address"
                ))))
                .returns::<simple_cloud_wallet::Result<H160>>()
                .invoke()
                .map_err(|_| Error::BadAccountContract)?;

            let attest_pair = KeyPair::from(config.attest_key);
            let tx_req = submittable
                .build_meta_tx(&attest_pair, from_address)
                .log_err("failed to build rollup meta-tx")
                .or(Err(Error::FailedToCreateTransaction))?;

            let signed_tx = build_call::<pink::PinkEnvironment>()
                .call(config.account_contract)
                .transferred_value(0)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!(
                        "sign_evm_transaction"
                    )))
                    .push_arg(tx_req),
                )
                .returns::<simple_cloud_wallet::Result<Vec<u8>>>()
                .invoke()
                .map_err(|_| Error::FailedToSignTransaction)?;

            // Actually submit the tx (no guarantee for success)
            let eth = Eth::new(PinkHttp::new(rpc));
            let tx_id = resolve_ready(eth.send_raw_transaction(signed_tx.into()))
                .map_err(|_| Error::FailedToSendTransaction)?;

            return Ok(Some(tx_id.encode()));
        }
        Ok(None)
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        const LENS_API: &str = "https://api-mumbai.lens.dev/";
        const TRANSFORM_JS: &str = "function transform(arg) { let input = JSON.parse(arg); return input.data.profile.stats.totalCollects; } transform(scriptArgs[0])";

        struct EnvVars {
            rpc: String,
            anchor: Vec<u8>,
        }

        fn get_env(key: &str) -> String {
            std::env::var(key).expect("env not found")
        }
        fn config() -> EnvVars {
            dotenvy::dotenv().ok();
            let rpc = get_env("RPC");
            let anchor = hex::decode(get_env("ANCHOR")).expect("hex decode failed");
            EnvVars { rpc, anchor }
        }

        #[ink::test]
        fn fixed_parse() {
            let _ = env_logger::try_init();
            pink_extension_runtime::mock_ext::mock_all_ext();
            let EnvVars { rpc, anchor } = config();

            let mut lens_oracle = ActionOffchainRollup::default();
            lens_oracle
                .config_client(
                    rpc,
                    anchor,
                    String::from(LENS_API),
                    String::from(TRANSFORM_JS),
                )
                .unwrap();

            assert_eq!(
                lens_oracle.fetch_lens_api_stats(String::from("01")),
                Err(Error::BadProfileId)
            );
            assert_eq!(
                lens_oracle.fetch_lens_api_stats(String::from("0x01 \\\"")),
                Err(Error::BadProfileId)
            );
            assert_eq!(
                lens_oracle.fetch_lens_api_stats(String::from("0xg")),
                Err(Error::BadProfileId)
            );

            // This will fail since there is no JS engine in unittest
            // let stats = lens_oracle
            //     .fetch_lens_api_stats(String::from("0x01"))
            //     .unwrap();
            // pink::warn!("TotalCollects: {stats:?}");
        }
    }
}
