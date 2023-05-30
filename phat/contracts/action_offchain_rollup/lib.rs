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
    use this_crate::{version_tuple, VersionTuple};

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
        /// Key for signing the rollup tx
        attest_key: [u8; 32],
        /// BrickProfile address to ask for tx signing (to pay gas fee)
        brick_profile: AccountId,
        client: Option<Client>,
        data_source: Option<DataSource>,
    }

    #[derive(Clone, Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct Client {
        /// The RPC endpoint of the target blockchain
        rpc: String,
        /// The client smart contract address on the target blockchain
        client_addr: [u8; 20],
    }

    #[derive(Clone, Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct DataSource {
        /// Data source url
        url: String,
        /// Data transform function in Javascript
        transform_js: String,
    }

    #[derive(Encode, Decode, Debug, PartialEq)]
    #[repr(u8)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        BadOrigin,
        ClientNotConfigured,
        DataSourceNotConfigured,
        BadBrickProfile,

        InvalidKeyLength,
        InvalidAddressLength,
        NoRequestInQueue,
        FailedToCreateClient,
        FailedToCommitTx,

        BadLensProfileId,

        FailedToFetchData,
        FailedToTransformData,
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
        pub fn new(brick_profile: AccountId) -> Self {
            const NONCE: &[u8] = b"attest_key";
            let random = signing::derive_sr25519_key(NONCE);
            Self {
                owner: Self::env().caller(),
                attest_key: random[..32]
                    .try_into()
                    .expect("random is long enough; qed."),
                brick_profile,
                client: None,
                data_source: None,
            }
        }

        #[ink(message)]
        pub fn version(&self) -> VersionTuple {
            version_tuple!()
        }

        /// Gets the owner of the contract
        #[ink(message)]
        pub fn owner(&self) -> AccountId {
            self.owner
        }

        /// Get the identity of offchain rollup
        #[ink(message)]
        pub fn get_attest_address(&self) -> H160 {
            let sk = pink_web3::keys::pink::KeyPair::from(self.attest_key);
            sk.address()
        }

        #[ink(message)]
        pub fn get_brick_profile_address(&self) -> AccountId {
            self.brick_profile
        }

        #[ink(message)]
        pub fn get_client(&self) -> Result<Client> {
            let client = self.ensure_client_configured()?;
            Ok(client.clone())
        }

        #[ink(message)]
        pub fn get_data_source(&self) -> Result<DataSource> {
            let data_source = self.ensure_data_source_configured()?;
            Ok(data_source.clone())
        }

        /// Configures the rollup target (admin only)
        #[ink(message)]
        pub fn config_client(&mut self, rpc: String, client_addr: Vec<u8>) -> Result<()> {
            self.ensure_owner()?;
            self.client = Some(Client {
                rpc,
                client_addr: client_addr
                    .try_into()
                    .or(Err(Error::InvalidAddressLength))?,
            });
            Ok(())
        }

        /// Configures the data source and transform js (admin only)
        #[ink(message)]
        pub fn config_data_source(&mut self, rpc: String, client_addr: Vec<u8>) -> Result<()> {
            self.ensure_owner()?;
            self.client = Some(Client {
                rpc,
                client_addr: client_addr
                    .try_into()
                    .or(Err(Error::InvalidAddressLength))?,
            });
            Ok(())
        }

        /// Transfers the ownership of the contract (admin only)
        ///
        /// transfer this to non-existent owner to renounce ownership and lock the configuration
        #[ink(message)]
        pub fn transfer_ownership(&mut self, new_owner: AccountId) -> Result<()> {
            self.ensure_owner()?;
            self.owner = new_owner;
            Ok(())
        }

        /// Processes a Lens Api stat request by a rollup transaction
        #[ink(message)]
        pub fn answer_request(&self) -> Result<Option<Vec<u8>>> {
            use ethabi::Token;
            let client = self.ensure_client_configured()?;
            let data_source = self.ensure_data_source_configured()?;

            let mut rollup_client = connect(&client)?;
            let action = match self.answer_request_inner(&mut rollup_client, data_source)? {
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
            rollup_client.action(Action::Reply(action));
            maybe_submit_tx(
                rollup_client,
                self.attest_key,
                self.brick_profile,
                client.rpc.clone(),
            )
        }

        fn answer_request_inner(
            &self,
            rollup_client: &mut EvmRollupClient,
            data_source: &DataSource,
        ) -> Result<LensResponse> {
            use ethabi::{ParamType, Token};
            use pink_kv_session::traits::QueueSession;
            // Get a request if presents
            let raw_req = rollup_client
                .session()
                .pop()
                .log_err("answer_request: failed to read queue")
                .or(Err(Error::FailedToGetStorage))?
                .ok_or(Error::NoRequestInQueue)?;
            // Decode the queue data by ethabi (u256, bytes)
            let Ok(decoded) = ethabi::decode(&[ParamType::Uint(32), ParamType::Bytes], &raw_req) else {
                pink::info!("Malformed request received");
                return Ok(LensResponse::Error(None, Error::FailedToDecode));
            };
            let [Token::Uint(rid), Token::Bytes(profile_id)] = decoded.as_slice() else {
                return Err(Error::FailedToDecode);
            };
            let profile_id = String::from_utf8_lossy(&profile_id);
            pink::info!("Request received for profile {profile_id}");

            // Get the Lens stats and respond as a rollup action.
            let result = Self::fetch_lens_api_stats(
                data_source.url.clone(),
                data_source.transform_js.clone(),
                String::from(profile_id),
            );
            match result {
                Ok(res) => {
                    // Respond
                    pink::info!("Processed result: {res}");
                    Ok(LensResponse::Response(*rid, res))
                }
                // Network issue, should retry
                Err(Error::FailedToFetchData) => Err(Error::FailedToFetchData),
                // otherwise tell client we cannot process it
                Err(e) => Ok(LensResponse::Error(Some(*rid), e)),
            }
        }

        pub fn fetch_lens_api_stats(
            lens_api: String,
            transform_js: String,
            profile_id: String,
        ) -> Result<u128> {
            // profile_id should be like 0x0001
            let is_hex_digit = |n| char::is_digit(n, 16);
            if !profile_id.starts_with("0x") || !profile_id[2..].chars().all(is_hex_digit) {
                return Err(Error::BadLensProfileId);
            }

            let headers = vec![("Content-Type".into(), "application/json".into())];
            let body = format!("{{\"query\":\"\\n          query Profile {{\\n            profile(request: {{ profileId: \\\"{profile_id}\\\" }}) {{\\n              stats {{\\n                totalFollowers\\n                totalFollowing\\n                totalPosts\\n                totalComments\\n                totalMirrors\\n                totalPublications\\n                totalCollects\\n              }}\\n            }}\\n          }}\\n          \"}}");

            let resp = pink::http_post!(lens_api, body.as_bytes(), headers);
            if resp.status_code != 200 {
                pink::warn!(
                    "Fail to read Lens api withstatus code: {}, reason: {}, body: {:?}",
                    resp.status_code,
                    resp.reason_phrase,
                    resp.body
                );
                return Err(Error::FailedToFetchData);
            }

            let resp_body = String::from_utf8(resp.body).or(Err(Error::FailedToDecode))?;
            let result = js::eval(transform_js.as_str(), &[resp_body])
                .map_err(|_| Error::FailedToTransformData)?;

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

        /// Returns BadOrigin error if the caller is not the owner
        fn ensure_owner(&self) -> Result<()> {
            if self.env().caller() == self.owner {
                Ok(())
            } else {
                Err(Error::BadOrigin)
            }
        }

        /// Returns the client config reference or raise the error `ClientNotConfigured`
        fn ensure_client_configured(&self) -> Result<&Client> {
            self.client.as_ref().ok_or(Error::ClientNotConfigured)
        }

        /// Returns the data source reference or raise the error `DataSourceNotConfigured`
        fn ensure_data_source_configured(&self) -> Result<&DataSource> {
            self.data_source
                .as_ref()
                .ok_or(Error::DataSourceNotConfigured)
        }
    }

    enum LensResponse {
        Response(U256, u128),
        Error(Option<U256>, Error),
    }

    fn connect(client: &Client) -> Result<EvmRollupClient> {
        let client_addr: H160 = client.client_addr.into();
        EvmRollupClient::new(&client.rpc, client_addr)
            .log_err("failed to create rollup client")
            .or(Err(Error::FailedToCreateClient))
    }

    fn maybe_submit_tx(
        rollup_client: EvmRollupClient,
        attest_key: [u8; 32],
        brick_profile: AccountId,
        rpc: String,
    ) -> Result<Option<Vec<u8>>> {
        use pink_web3::keys::pink::KeyPair;
        let maybe_submittable = rollup_client
            .commit()
            .log_err("failed to commit")
            .or(Err(Error::FailedToCommitTx))?;
        if let Some(submittable) = maybe_submittable {
            // get BrickProfile info
            let from_address = build_call::<pink::PinkEnvironment>()
                .call(brick_profile)
                .transferred_value(0)
                .exec_input(ExecutionInput::new(Selector::new(ink::selector_bytes!(
                    "get_current_evm_account_address"
                ))))
                .returns::<brick_profile::Result<H160>>()
                .invoke()
                .map_err(|_| Error::BadBrickProfile)?;

            let attest_pair = KeyPair::from(attest_key);
            let tx_req = submittable
                .build_meta_tx(&attest_pair, from_address)
                .log_err("failed to build rollup meta-tx")
                .or(Err(Error::FailedToCreateTransaction))?;

            let signed_tx = build_call::<pink::PinkEnvironment>()
                .call(brick_profile)
                .transferred_value(0)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!(
                        "sign_evm_transaction"
                    )))
                    .push_arg(tx_req),
                )
                .returns::<brick_profile::Result<Vec<u8>>>()
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

            let lens_api = String::from(LENS_API);
            let transform_js = String::from(TRANSFORM_JS);

            assert_eq!(
                ActionOffchainRollup::fetch_lens_api_stats(
                    lens_api.clone(),
                    transform_js.clone(),
                    String::from("01")
                ),
                Err(Error::BadLensProfileId)
            );
            assert_eq!(
                ActionOffchainRollup::fetch_lens_api_stats(
                    lens_api.clone(),
                    transform_js.clone(),
                    String::from("0x01 \\\"")
                ),
                Err(Error::BadLensProfileId)
            );
            assert_eq!(
                ActionOffchainRollup::fetch_lens_api_stats(
                    lens_api.clone(),
                    transform_js.clone(),
                    String::from("0xg")
                ),
                Err(Error::BadLensProfileId)
            );

            // This will fail since there is no JS engine in unittest
            // let stats = ActionOffchainRollup::fetch_lens_api_stats(
            //     lens_api.clone(),
            //     transform_js.clone(),
            //     String::from("0x01"),
            // )
            // .unwrap();
            // pink::warn!("TotalCollects: {stats:?}");
        }
    }
}
