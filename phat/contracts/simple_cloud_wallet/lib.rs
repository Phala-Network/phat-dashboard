#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub use simple_cloud_wallet::*;

#[ink::contract(env = pink::PinkEnvironment)]
mod simple_cloud_wallet {
    use alloc::{format, string::String, vec::Vec};
    use core::convert::TryInto;
    use ink::storage::{traits::StorageLayout, Mapping};
    use pink_extension as pink;
    use pink_extension::chain_extension::signing;
    use pink_json as json;
    use pink_web3::{
        transports::{pink_http::PinkHttp, resolve_ready},
        types::{TransactionParameters, TransactionRequest},
    };
    use scale::{Decode, Encode};

    pub type ExternalAccountId = u64;
    pub type WorkflowId = u64;

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    pub enum EvmAccountType {
        Imported,
        Generated,
    }

    #[ink(storage)]
    pub struct SimpleCloudWallet {
        owner: AccountId,
        next_workflow_id: WorkflowId,
        workflows: Mapping<WorkflowId, Workflow>,
        next_external_account_id: ExternalAccountId,
        external_accounts: Mapping<ExternalAccountId, EvmAccount>,
        session_token: u64,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    struct EvmAccount {
        id: ExternalAccountId,
        /// An EvmAccount is disabled once it is dumped
        enabled: bool,
        account_type: EvmAccountType,
        // This determines on which chain you can use this account
        // The same sk can be used to create multiple EvmAccounts on different chains
        rpc: String,
        sk: [u8; 32],
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, StorageLayout))]
    struct Workflow {
        id: WorkflowId,
        enabled: bool,
        commandline: String,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        BadOrigin,
        BadEvmSecretKey,
        BadUnsignedTransaction,
        WorkflowNotFound,
        ExternalAccountNotFound,
        ExternalAccountDumped,
        FailedToSignTransaction(String),
    }
    pub type Result<T> = core::result::Result<T, Error>;

    impl SimpleCloudWallet {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {
                owner: Self::env().caller(),
                next_workflow_id: 0,
                workflows: Mapping::default(),
                next_external_account_id: 0,
                external_accounts: Mapping::default(),
                session_token: 0,
            }
        }

        /// Gets the owner of the contract
        #[ink(message)]
        pub fn owner(&self) -> AccountId {
            self.owner
        }

        /// Gets the total number of workerflows
        #[ink(message)]
        pub fn workflow_count(&self) -> u64 {
            self.next_workflow_id
        }

        /// Adds a new workflow, only owner is allowed
        #[ink(message)]
        pub fn add_workflow(&mut self, commandline: String) -> Result<WorkflowId> {
            self.ensure_owner()?;

            let id = self.next_workflow_id;
            // TODO: validate commandline?
            let workflow = Workflow {
                id,
                enabled: true,
                commandline,
            };
            self.workflows.insert(id, &workflow);
            self.next_workflow_id += 1;

            Ok(id)
        }

        /// Enable a workflow, only owner is allowed
        #[ink(message)]
        pub fn enable_workflow(&mut self, id: WorkflowId) -> Result<()> {
            self.ensure_owner()?;
            let workflow = self.workflows.get(id).ok_or(Error::WorkflowNotFound)?;
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
            let workflow = self.workflows.get(id).ok_or(Error::WorkflowNotFound)?;
            if workflow.enabled {
                workflow.enabled = false;
                self.workflows.insert(id, &workflow);
            }
            Ok(())
        }

        /// Gets workflow details, only owner is allowed
        #[ink(message)]
        pub fn get_workflow(&self, id: WorkflowId) -> Result<Workflow> {
            self.ensure_owner()?;
            self.workflows.get(id).ok_or(Error::WorkflowNotFound)
        }

        /// Gets the total number of external accounts
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
            let evm_account = EvmAccount {
                id,
                enabled: true,
                account_type: EvmAccountType::Generated,
                rpc,
                sk: random[..32].try_into().or(Err(Error::BadEvmSecretKey))?,
            };
            self.external_accounts.insert(id, &evm_account);
            self.next_external_account_id += 1;

            Ok(id)
        }

        /// Adds an existing EVM account, only owner is allowed
        #[ink(message)]
        pub fn import_evm_account(
            &mut self,
            rpc: String,
            sk: Vec<u8>,
        ) -> Result<ExternalAccountId> {
            self.ensure_owner()?;

            let id = self.next_external_account_id;
            let evm_account = EvmAccount {
                id,
                enabled: true,
                account_type: EvmAccountType::Imported,
                rpc,
                sk: sk.try_into().or(Err(Error::BadEvmSecretKey))?,
            };
            self.external_accounts.insert(id, &evm_account);
            self.next_external_account_id += 1;

            Ok(id)
        }

        /// Dump an EVM account secret key, this will disable it and zeroize the sk, only owner is allowed
        #[ink(message)]
        pub fn dump_evm_account(&mut self, id: ExternalAccountId) -> Result<[u8; 32]> {
            self.ensure_owner()?;

            let account = self
                .external_accounts
                .get(id)
                .ok_or(Error::ExternalAccountNotFound)?;
            if !account.enabled {
                return Err(Error::ExternalAccountDumped);
            }

            let sk = account.sk;
            account.enabled = false;
            account.sk = [0; 32];
            self.external_accounts.insert(id, &account);

            Ok(sk)
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
