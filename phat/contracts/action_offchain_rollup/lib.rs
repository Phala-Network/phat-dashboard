#![cfg_attr(not(feature = "std"), no_std, no_main)]

extern crate alloc;

pub use crate::action_offchain_rollup::*;

#[ink::contract(env = pink_extension::PinkEnvironment)]
mod action_offchain_rollup {
    use alloc::{string::String, vec::Vec};
    use ink::env::call::{build_call, ExecutionInput, Selector};
    #[cfg(feature = "std")]
    use ink::storage::traits::StorageLayout;
    use ink::storage::Lazy;
    use pink_extension as pink;
    use pink_extension::chain_extension::signing;
    use pink_web3::{
        api::{Eth, Namespace},
        keys::pink::KeyPair,
        signing::Key,
        transports::{resolve_ready, PinkHttp},
        types::H160,
    };
    use scale::{Decode, Encode};
    use this_crate::{version_tuple, VersionTuple};

    // To enable `(result).log_err("Reason")?`
    use pink::ResultExt;

    use ethabi::Token;
    use phat_js as js;
    use phat_offchain_rollup::{
        clients::evm::{sign_meta_tx, EvmRollupClient},
        Action,
    };

    type CodeHash = [u8; 32];

    #[derive(Clone, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct Core {
        /// The JS code that processes the rollup queue request
        script: String,
        /// The configuration that would be passed to the core js script
        settings: String,
        /// The code hash of the core js script
        code_hash: CodeHash,
    }

    #[ink(storage)]
    pub struct ActionOffchainRollup {
        owner: AccountId,
        /// Key for signing the rollup tx
        attest_key: [u8; 32],
        /// BrickProfile address to ask for tx signing (to pay gas fee)
        brick_profile: AccountId,
        client: Option<Client>,
        /// The JS code that processes the rollup queue request
        core: Lazy<Core>,
    }

    #[derive(Clone, Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct Client {
        /// The RPC endpoint of the target blockchain
        rpc: String,
        /// The client smart contract address on the target blockchain
        client_addr: [u8; 20],
    }

    #[derive(Encode, Decode, Debug, PartialEq)]
    #[repr(u8)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        BadOrigin,
        ClientNotConfigured,
        CoreNotConfigured,
        BadBrickProfile,

        InvalidAddressLength,
        NoRequestInQueue,
        FailedToCreateClient,
        FailedToCommitTx,

        FailedToGetStorage,
        FailedToCreateTransaction,
        FailedToSignTransaction,
        FailedToSendTransaction,

        InvalidJsOutput,
        JsError(String),
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
                core: Default::default(),
            }
        }

        #[ink(constructor)]
        pub fn with_core(core_js: String, core_settings: String, brick_profile: AccountId) -> Self {
            let mut this = Self::new(brick_profile);
            this.config_core_inner(core_js, core_settings);
            this
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
            KeyPair::from(self.attest_key).address()
        }

        #[ink(message)]
        pub fn get_brick_profile_address(&self) -> AccountId {
            self.brick_profile
        }

        #[ink(message)]
        pub fn set_brick_profile_address(&mut self, brick_profile: AccountId) -> Result<()> {
            self.ensure_owner()?;
            self.brick_profile = brick_profile;
            Ok(())
        }

        #[ink(message)]
        pub fn get_client(&self) -> Result<Client> {
            self.ensure_owner()?;
            let client = self.ensure_client_configured()?;
            Ok(client.clone())
        }

        #[ink(message)]
        pub fn get_core(&self) -> Option<Core> {
            self.core.get()
        }

        /// Configures the core script (admin only)
        #[ink(message)]
        pub fn config_core(&mut self, core_js: String, settings: String) -> Result<()> {
            self.ensure_owner()?;
            self.config_core_inner(core_js, settings);
            Ok(())
        }

        /// Set the configuration (admin only)
        #[ink(message)]
        pub fn config_core_settings(&mut self, settings: String) -> Result<()> {
            self.ensure_owner()?;
            let Some(mut core) = self.core.get() else {
                return Err(Error::CoreNotConfigured);
            };
            core.settings = settings;
            self.core.set(&core);
            Ok(())
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

        /// Transfers the ownership of the contract (admin only)
        ///
        /// transfer this to non-existent owner to renounce ownership and lock the configuration
        #[ink(message)]
        pub fn transfer_ownership(&mut self, new_owner: AccountId) -> Result<()> {
            self.ensure_owner()?;
            self.owner = new_owner;
            Ok(())
        }

        /// Pop an element from the rollup queue if any and process it, then submit the answer.
        #[ink(message)]
        pub fn answer_request(&self) -> Result<Option<Vec<u8>>> {
            use pink_kv_session::traits::QueueSession;
            let client = self.ensure_client_configured()?;

            let mut rollup_client = connect(client)?;
            // Get a request if presents
            let request = rollup_client
                .session()
                .pop()
                .log_err("answer_request: failed to read queue")
                .or(Err(Error::FailedToGetStorage))?
                .ok_or(Error::NoRequestInQueue)?;
            let (reply, _hash) = self.handle_request(&request)?;
            // TODO: submit tx with code hash
            rollup_client.action(Action::Reply(reply));
            maybe_submit_tx(
                rollup_client,
                self.attest_key,
                self.brick_profile,
                client.rpc.clone(),
            )
        }

        /// Processes a request with the the core js and returns the output wrapped in a signed meta tx.
        #[ink(message)]
        pub fn get_answer(&self, request: Vec<u8>) -> Result<Vec<u8>> {
            let client = self.ensure_client_configured()?;
            let (reply, _js_hash) = self.handle_request(&request)?;
            let (tx, sig) = sign_meta_tx(
                &client.rpc,
                client.client_addr.into(),
                &reply,
                &KeyPair::from(self.attest_key),
            )
            .log_err("failed to sign transaction")
            .or(Err(Error::FailedToSignTransaction))?;
            Ok(ethabi::encode(&[tx, Token::Bytes(sig.0)]))
        }

        /// Processes a request with the the core js and returns the output wrapped in a signed meta tx.
        ///
        /// The output is a tuple of the reply and the sha256 hash of the core js.
        /// The hash can be used to verify the integrity of the core js.
        #[ink(message)]
        pub fn get_answer_with_code_hash(&self, request: Vec<u8>) -> Result<Vec<u8>> {
            let client = self.ensure_client_configured()?;
            let (reply, js_hash) = self.handle_request(&request)?;
            let data = ethabi::encode(&[Token::Bytes(reply), Token::FixedBytes(js_hash.to_vec())]);
            let (tx, sig) = sign_meta_tx(
                &client.rpc,
                client.client_addr.into(),
                &data,
                &KeyPair::from(self.attest_key),
            )
            .log_err("failed to sign transaction")
            .or(Err(Error::FailedToSignTransaction))?;
            Ok(ethabi::encode(&[tx, Token::Bytes(sig.0)]))
        }

        /// Processes a request with the the core js and returns the output without signature.
        #[ink(message)]
        pub fn get_raw_answer(&self, request: Vec<u8>) -> Result<(Vec<u8>, CodeHash)> {
            self.handle_request(&request)
        }

        /// Processes a request with the the core js and returns the output.
        fn handle_request(&self, request: &[u8]) -> Result<(Vec<u8>, CodeHash)> {
            let Some(Core{ script, settings, code_hash }) = self.core.get() else {
                pink::error!("CoreNotConfigured");
                return Err(Error::CoreNotConfigured);
            };
            let args = alloc::vec![alloc::format!("0x{}", hex_fmt::HexFmt(request)), settings];
            let output = js::eval(&script, &args)
                .log_err("Failed to eval the core js")
                .map_err(Error::JsError)?;
            let output = match output {
                js::Output::String(bytes) => hex::decode(bytes.as_str().trim_start_matches("0x"))
                    .map_err(|_| Error::InvalidJsOutput)?,
                js::Output::Bytes(b) => b,
            };
            Ok((output, code_hash))
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

        fn config_core_inner(&mut self, core_js: String, settings: String) {
            let code_hash = self
                .env()
                .hash_bytes::<ink::env::hash::Sha2x256>(core_js.as_bytes());
            // TODO: To avoid wasting storage, we can
            // - make a generic contract to store k-v pairs.
            // - use the hash as the key to store the js.
            // - store only hash in the app contract.
            self.core.set(&Core {
                script: core_js,
                settings,
                code_hash,
            });
        }
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
}
