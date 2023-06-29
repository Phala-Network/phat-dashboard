#![cfg_attr(not(feature = "std"), no_std, no_main)]

extern crate alloc;

pub use brick_profile::*;

#[ink::contract(env = pink::PinkEnvironment)]
mod brick_profile {
    use alloc::{format, string::String, vec::Vec};
    use core::convert::TryInto;
    use ink::storage::{traits::StorageLayout, Mapping};
    use pink_extension as pink;
    use pink_extension::chain_extension::signing;
    use pink_json as json;
    use pink_web3::{
        signing::Key,
        transports::{pink_http::PinkHttp, resolve_ready},
        types::{TransactionParameters, TransactionRequest, H160},
    };
    use scale::{Decode, Encode};
    use this_crate::{version_tuple, VersionTuple};

    pub type ExternalAccountId = u64;
    pub type WorkflowId = u64;

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub enum ExternalAccountType {
        Imported,
        Generated,
        Dumped,
    }

    #[ink(storage)]
    pub struct BrickProfile {
        owner: AccountId,
        config: Option<Config>,
        next_workflow_id: WorkflowId,
        workflows: Mapping<WorkflowId, Workflow>,
        next_external_account_id: ExternalAccountId,
        external_accounts: Mapping<ExternalAccountId, ExternalAccount>,
        authorized_account: Mapping<WorkflowId, ExternalAccountId>,
        workflow_session: Option<WorkflowId>,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    struct Config {
        js_runner: AccountId,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct ExternalAccount {
        id: ExternalAccountId,
        /// An ExternalAccount is disabled once it is dumped
        enabled: bool,
        account_type: ExternalAccountType,
        // This determines on which chain you can use this account
        // The same sk can be used to create multiple ExternalAccounts on different chains
        rpc: String,
        sk: [u8; 32],
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub struct Workflow {
        id: WorkflowId,
        name: String,
        enabled: bool,
        commandline: String,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        BadOrigin,
        NotConfigured,
        Deprecated,
        NoPollForTransaction,
        BadWorkflowSession,
        BadEvmSecretKey,
        BadUnsignedTransaction,
        WorkflowNotFound,
        WorkflowDisabled,
        NoAuthorizedExternalAccount,
        ExternalAccountNotFound,
        ExternalAccountDisabled,
        FailedToGetEthAccounts(String),
        FailedToSignTransaction(String),
    }
    pub type Result<T> = core::result::Result<T, Error>;

    impl BrickProfile {
        #[ink(constructor)]
        pub fn new(owner: AccountId) -> Self {
            Self {
                owner,
                config: None,
                next_workflow_id: 0,
                workflows: Mapping::default(),
                next_external_account_id: 0,
                external_accounts: Mapping::default(),
                authorized_account: Mapping::default(),
                workflow_session: None,
            }
        }

        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Self::env().caller())
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

        /// Gets the contract address of Js runner contract
        #[ink(message)]
        pub fn get_js_runner(&self) -> Result<AccountId> {
            let config = self.config.as_ref().ok_or(Error::NotConfigured)?;
            Ok(config.js_runner.clone())
        }

        /// Configures the workflow executor
        #[ink(message)]
        pub fn config(&mut self, js_runner: AccountId) -> Result<()> {
            self.ensure_owner()?;
            self.config = Some(Config { js_runner });
            Ok(())
        }

        /// Gets the total number of workerflows
        #[ink(message)]
        pub fn workflow_count(&self) -> u64 {
            self.next_workflow_id
        }

        /// Adds a new workflow, only owner is allowed
        #[ink(message)]
        pub fn add_workflow(&mut self, name: String, commandline: String) -> Result<WorkflowId> {
            self.ensure_owner()?;

            let id = self.next_workflow_id;
            // TODO: validate commandline?
            let workflow = Workflow {
                id,
                name,
                enabled: true,
                commandline,
            };
            self.workflows.insert(id, &workflow);
            self.next_workflow_id += 1;

            Ok(id)
        }

        /// Gets workflow details, only owner is allowed
        #[ink(message)]
        pub fn get_workflow(&self, id: WorkflowId) -> Result<Workflow> {
            self.ensure_owner()?;
            self.ensure_workflow(id)
        }

        /// Enable a workflow, only owner is allowed
        #[ink(message)]
        pub fn enable_workflow(&mut self, id: WorkflowId) -> Result<()> {
            self.ensure_owner()?;
            let mut workflow = self.ensure_workflow(id)?;
            if !workflow.enabled {
                workflow.enabled = true;
                self.workflows.insert(id, &workflow);
            }
            Ok(())
        }

        /// Disable a workflow, only owner is allowed
        #[ink(message)]
        pub fn disable_workflow(&mut self, id: WorkflowId) -> Result<()> {
            self.ensure_owner()?;
            let mut workflow = self.ensure_workflow(id)?;
            if workflow.enabled {
                workflow.enabled = false;
                self.workflows.insert(id, &workflow);
            }
            Ok(())
        }

        /// Get the EVM account address of given id
        #[ink(message)]
        pub fn get_evm_account_address(&self, id: ExternalAccountId) -> Result<H160> {
            let account = self.ensure_enabled_external_account(id)?;
            let sk = pink_web3::keys::pink::KeyPair::from(account.sk);
            Ok(sk.address())
        }

        /// Gets the total number of external accounts
        /// The external account ids increase from 0 to current count
        #[ink(message)]
        pub fn external_account_count(&self) -> u64 {
            self.next_external_account_id
        }

        /// Generates a new EVM account, only owner is allowed
        #[ink(message)]
        pub fn generate_evm_account(&mut self, rpc: String) -> Result<ExternalAccountId> {
            self.ensure_owner()?;

            let id = self.next_external_account_id;
            let random = signing::derive_sr25519_key(&id.to_be_bytes());
            let evm_account = ExternalAccount {
                id,
                enabled: true,
                account_type: ExternalAccountType::Generated,
                rpc,
                sk: random[..32].try_into().or(Err(Error::BadEvmSecretKey))?,
            };
            self.external_accounts.insert(id, &evm_account);
            self.next_external_account_id += 1;

            Ok(id)
        }

        /// Adds an existing EVM account, only owner is allowed
        /// This is only used for dev and will be removed in release
        #[ink(message)]
        pub fn import_evm_account(
            &mut self,
            rpc: String,
            sk: Vec<u8>,
        ) -> Result<ExternalAccountId> {
            // Deprecated in first release
            return Err(Error::Deprecated);

            self.ensure_owner()?;

            let id = self.next_external_account_id;
            let evm_account = ExternalAccount {
                id,
                enabled: true,
                account_type: ExternalAccountType::Imported,
                rpc,
                sk: sk.try_into().or(Err(Error::BadEvmSecretKey))?,
            };
            self.external_accounts.insert(id, &evm_account);
            self.next_external_account_id += 1;

            Ok(id)
        }

        /// Dump an EVM account secret key, this will disable the account and zeroize the sk, only owner is allowed
        #[ink(message)]
        pub fn dump_evm_account(&mut self, id: ExternalAccountId) -> Result<()> {
            // Deprecated in first release
            return Err(Error::Deprecated);

            self.ensure_owner()?;

            let mut account = self.ensure_enabled_external_account(id)?;
            account.enabled = false;
            account.account_type = ExternalAccountType::Dumped;
            self.external_accounts.insert(id, &account);

            Ok(())
        }

        /// Authorize workflow to use account, only owner is allowed
        #[ink(message)]
        pub fn authorize_workflow(
            &mut self,
            workflow: WorkflowId,
            account: ExternalAccountId,
        ) -> Result<()> {
            self.ensure_owner()?;

            self.ensure_workflow(workflow)?;
            self.ensure_external_account(account)?;
            self.authorized_account.insert(workflow, &account);
            Ok(())
        }

        /// Get the authorized external account id of given workflow
        #[ink(message)]
        pub fn get_authorized_account(&self, workflow: WorkflowId) -> Option<ExternalAccountId> {
            self.authorized_account.get(workflow)
        }

        /// This is an internal function which can only be called by `this.poll()` in a cross-contract manner
        #[ink(message)]
        pub fn set_workflow_session(&mut self, workflow: WorkflowId) -> Result<()> {
            if self.env().caller() != self.env().account_id() {
                return Err(Error::BadOrigin);
            }
            self.workflow_session = Some(workflow);
            Ok(())
        }

        /// Called by a scheduler periodically with Query
        #[ink(message)]
        pub fn poll(&mut self, workflow_id: WorkflowId) -> Result<bool> {
            use ink::env::call::{build_call, ExecutionInput, Selector};

            // Trick here: We only allow Query the `poll()` function, so the following `workflow_session` change only
            // lives in this call and is never written back to chain.
            if pink::ext().is_in_transaction() {
                return Err(Error::NoPollForTransaction);
            }

            let now_workflow = self.ensure_enabled_workflow(workflow_id)?;
            // call `this.set_workflow_session()` in a cross-contract manner to let the `self.workflow_session` value
            // change take effect
            // this value change only lives in this execution since `poll()` is called with query
            let _ = build_call::<pink::PinkEnvironment>()
                .call(self.env().account_id())
                .transferred_value(0)
                .call_flags(ink::env::CallFlags::default().set_allow_reentry(true))
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!(
                        "set_workflow_session"
                    )))
                    .push_arg(now_workflow.id),
                )
                .returns::<Result<()>>()
                .invoke();

            let js_runner = self.get_js_runner()?;
            let call_result = build_call::<pink::PinkEnvironment>()
                .call(js_runner)
                // .gas_limit(5000)
                .transferred_value(0)
                .call_flags(ink::env::CallFlags::default().set_allow_reentry(true))
                .exec_input(
                    // pub fn run(&self, actions: String) -> bool, 0xb95b5eb3
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("run")))
                        .push_arg(now_workflow.commandline),
                )
                .returns::<bool>()
                .invoke();
            Ok(call_result)
        }

        /// Only self-initiated call is allowed
        #[ink(message)]
        pub fn get_current_evm_account_address(&self) -> Result<H160> {
            let now_workflow_id = self.ensure_workflow_session()?;
            let account_id = self
                .authorized_account
                .get(now_workflow_id)
                .ok_or(Error::NoAuthorizedExternalAccount)?;
            self.get_evm_account_address(account_id)
        }

        /// Only self-initiated call is allowed
        #[ink(message)]
        pub fn sign_evm_transaction(&self, tx: Vec<u8>) -> Result<Vec<u8>> {
            let now_workflow_id = self.ensure_workflow_session()?;
            pink::info!("Workflow {} asks for EVM tx signing", now_workflow_id);

            let account_id = self
                .authorized_account
                .get(now_workflow_id)
                .ok_or(Error::NoAuthorizedExternalAccount)?;
            let account = self.ensure_enabled_external_account(account_id)?;
            pink::info!("ExternalAccount {} is allowed", account_id);

            let phttp = PinkHttp::new(account.rpc.clone());
            let web3 = pink_web3::Web3::new(phttp);
            let sk = pink_web3::keys::pink::KeyPair::from(account.sk);

            let tx: TransactionRequest =
                json::from_slice(&tx).or(Err(Error::BadUnsignedTransaction))?;
            let tx = TransactionParameters {
                nonce: tx.nonce,
                to: tx.to,
                gas: tx.gas.unwrap_or_default(),
                gas_price: tx.gas_price,
                value: tx.value.unwrap_or_default(),
                data: tx.data.unwrap_or_default(),
                transaction_type: tx.transaction_type,
                access_list: tx.access_list,
                max_priority_fee_per_gas: tx.max_priority_fee_per_gas,
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

        fn ensure_workflow_session(&self) -> Result<WorkflowId> {
            if self.workflow_session.is_some() {
                Ok(self.workflow_session.unwrap())
            } else {
                Err(Error::BadWorkflowSession)
            }
        }

        fn ensure_workflow(&self, id: WorkflowId) -> Result<Workflow> {
            self.workflows.get(id).ok_or(Error::WorkflowNotFound)
        }

        fn ensure_enabled_workflow(&self, id: WorkflowId) -> Result<Workflow> {
            let workflow = self.ensure_workflow(id)?;
            if !workflow.enabled {
                Err(Error::WorkflowDisabled)
            } else {
                Ok(workflow)
            }
        }

        fn ensure_external_account(&self, id: ExternalAccountId) -> Result<ExternalAccount> {
            self.external_accounts
                .get(id)
                .ok_or(Error::ExternalAccountNotFound)
        }

        fn ensure_enabled_external_account(
            &self,
            id: ExternalAccountId,
        ) -> Result<ExternalAccount> {
            let account = self.ensure_external_account(id)?;
            if !account.enabled {
                Err(Error::ExternalAccountDisabled)
            } else {
                Ok(account)
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use alloc::collections::BTreeMap;

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
        fn workflow_management_works() {
            let _ = env_logger::try_init();
            pink_extension_runtime::mock_ext::mock_all_ext();

            let mut profile = BrickProfile::default();

            // Basic add and get
            let cmd = String::from("[
                {\"cmd\": \"fetch\", \"config\": {\"returnTextBody\":true,\"url\":\"https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR\"}},
                {\"cmd\": \"eval\", \"config\": \"Math.round(JSON.parse(input.body).USD)\"},
                {\"cmd\": \"eval\", \"config\": \"numToUint8Array32(input)\"},
            ]");
            let name = String::from("TestWorkflow");
            let wf1_id = profile.add_workflow(name.clone(), cmd.clone()).unwrap();
            let _ = profile.add_workflow(name.clone(), cmd.clone()).unwrap();
            assert_eq!(profile.workflow_count(), 2);

            let wf1_details = profile.get_workflow(wf1_id).unwrap();
            assert_eq!(wf1_details.commandline, cmd);
            assert!(wf1_details.enabled);
            assert!(matches!(
                profile.get_workflow(3),
                Err(Error::WorkflowNotFound)
            ));

            // Workflow enable and disable
            let _ = profile.disable_workflow(wf1_id);
            let wf1_details = profile.get_workflow(wf1_id).unwrap();
            assert!(!wf1_details.enabled);

            let _ = profile.enable_workflow(wf1_id);
            let wf1_details = profile.get_workflow(wf1_id).unwrap();
            assert!(wf1_details.enabled);

            // Access control
            let accounts = ink::env::test::default_accounts::<pink::PinkEnvironment>();
            let contract = ink::env::account_id::<pink::PinkEnvironment>();
            ink::env::test::set_callee::<pink::PinkEnvironment>(contract);
            ink::env::test::set_caller::<pink::PinkEnvironment>(accounts.bob);

            assert!(matches!(
                profile.add_workflow(name.clone(), cmd.clone()),
                Err(Error::BadOrigin)
            ));
            assert!(matches!(
                profile.get_workflow(wf1_id),
                Err(Error::BadOrigin)
            ));
            assert!(matches!(
                profile.enable_workflow(wf1_id),
                Err(Error::BadOrigin)
            ));
            assert!(matches!(
                profile.disable_workflow(wf1_id),
                Err(Error::BadOrigin)
            ));
        }

        #[ink::test]
        fn external_account_management_works() {
            let _ = env_logger::try_init();
            pink_extension_runtime::mock_ext::mock_all_ext();

            let EnvVars { rpc, key } = config();

            let mut profile = BrickProfile::default();

            // Account generation
            let ea1_id = profile.generate_evm_account(rpc.clone()).unwrap();
            let _ = profile.generate_evm_account(rpc.clone()).unwrap();
            assert_eq!(profile.external_account_count(), 2);
            let _address = profile.get_evm_account_address(ea1_id).unwrap();

            // Deprecated for first release
            assert!(matches!(
                profile.import_evm_account(rpc.clone(), key.clone()),
                Err(Error::Deprecated)
            ));
            assert!(matches!(
                profile.dump_evm_account(ea1_id),
                Err(Error::Deprecated)
            ));

            // Access control
            let accounts = ink::env::test::default_accounts::<pink::PinkEnvironment>();
            let contract = ink::env::account_id::<pink::PinkEnvironment>();
            ink::env::test::set_callee::<pink::PinkEnvironment>(contract);
            ink::env::test::set_caller::<pink::PinkEnvironment>(accounts.bob);
            assert!(matches!(
                profile.generate_evm_account(rpc.clone()),
                Err(Error::BadOrigin)
            ));
        }

        #[ink::test]
        fn workflow_auth_works() {
            let _ = env_logger::try_init();
            pink_extension_runtime::mock_ext::mock_all_ext();

            let EnvVars { rpc, key: _ } = config();

            let mut profile = BrickProfile::default();

            let cmd = String::from("[
                {\"cmd\": \"fetch\", \"config\": {\"returnTextBody\":true,\"url\":\"https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR\"}},
                {\"cmd\": \"eval\", \"config\": \"Math.round(JSON.parse(input.body).USD)\"},
                {\"cmd\": \"eval\", \"config\": \"numToUint8Array32(input)\"},
            ]");
            let name = String::from("TestWorkflow");

            let wf1_id = profile.add_workflow(name.clone(), cmd.clone()).unwrap();
            let wf2_id = profile.add_workflow(name.clone(), cmd.clone()).unwrap();
            let wf3_id = profile.add_workflow(name.clone(), cmd.clone()).unwrap();
            let ea1_id = profile.generate_evm_account(rpc.clone()).unwrap();
            let ea2_id = profile.generate_evm_account(rpc.clone()).unwrap();

            let workflow_accounts =
                BTreeMap::from([(wf1_id, ea1_id), (wf2_id, ea2_id), (wf3_id, ea2_id)]);

            for (wf_id, ea_id) in workflow_accounts.iter() {
                profile
                    .authorize_workflow(wf_id.clone(), ea_id.clone())
                    .unwrap();
                assert_eq!(
                    profile.get_authorized_account(wf_id.clone()).unwrap(),
                    ea_id.clone()
                );
            }

            // Test dynamic authorization
            let contract = ink::env::account_id::<pink::PinkEnvironment>();
            ink::env::test::set_callee::<pink::PinkEnvironment>(contract);
            ink::env::test::set_caller::<pink::PinkEnvironment>(contract);

            for (wf_id, ea_id) in workflow_accounts.iter() {
                profile.set_workflow_session(wf_id.clone()).unwrap();
                let current_evm_address = profile.get_current_evm_account_address().unwrap();
                let expected_evm_address = profile.get_evm_account_address(ea_id.clone()).unwrap();
                assert_eq!(current_evm_address, expected_evm_address);
            }
        }
    }
}
