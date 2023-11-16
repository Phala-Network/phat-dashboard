#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[macro_use]
extern crate alloc;

pub use codebase::{BaseInfo, CodebaseRef};

#[ink::contract]
mod codebase {
    // Importing necessary modules from ink
    use ink::codegen::Env;
    use ink::{env::hash::Blake2x256, storage::Mapping};
    use scale::{Decode, Encode};

    // Use alloc for dynamic memory allocation
    use alloc::string::String;
    use alloc::vec::Vec;

    // Importing logging utilities
    use driver::{Error, PhatCodeProvider};
    use pink::{error, info};

    #[cfg(feature = "std")]
    use {ink::storage::traits::StorageLayout, scale_info::TypeInfo};

    type Result<T> = core::result::Result<T, Error>;

    /// Event emitted when a new code is uploaded
    #[ink(event)]
    pub struct CodeUploaded {
        /// Hash of the uploaded code
        #[ink(topic)]
        pub code_hash: Hash,
        /// Account ID of the uploader
        #[ink(topic)]
        pub uploader: AccountId,
    }

    /// Event emitted when a code becomes unused
    #[ink(event)]
    pub struct CodeBecomeUnused {
        /// Hash of the unused code
        #[ink(topic)]
        pub code_hash: Hash,
    }

    /// Event to indicate that one or more codes have been removed
    #[ink(event)]
    pub struct CodesRemoved {
        /// List of hashes of the removed codes
        pub codes: Vec<Hash>,
    }

    /// Structure to store metadata for each piece of code
    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(TypeInfo, StorageLayout))]
    struct CodeMetadata {
        pub ref_cnt: u32,           // Reference count of the code
        pub uploaded_at_block: u32, // Block number when the code was uploaded
    }

    /// Structure to store overall information about the codebase
    /// This includes general statistics and configuration parameters.
    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(TypeInfo, StorageLayout))]
    pub struct BaseInfo {
        /// Total count of all stored codes
        pub count: u64,
        /// Total size (in bytes) of all stored codes
        pub total_size: u64,
        /// Total reference count across all codes
        pub total_ref_cnt: u64,
        /// Maximum allowed size (in bytes) for a single code
        pub max_code_size: u64,
        /// Maximum allowed total size (in bytes) of all stored codes
        pub capacity: u64,
    }

    // Default values for BaseInfo
    impl Default for BaseInfo {
        fn default() -> Self {
            Self {
                count: 0,
                total_size: 0,
                total_ref_cnt: 0,
                max_code_size: 1024 * 1024, // Default max code size set to 1MB
                capacity: 1024 * 1024 * 100, // Default capacity set to 100MB
            }
        }
    }

    #[derive(Default)]
    #[ink(storage)]
    pub struct Codebase {
        /// List of accounts that have manager privileges
        managers: Vec<AccountId>,
        /// Basic info about the codebase including counts and limits
        base_info: BaseInfo,
        /// Mapping from code hashes to their metadata
        metadatas: Mapping<Hash, CodeMetadata>,
        /// Mapping from code hashes to the actual code content
        codes: Mapping<Hash, String>,
        /// Mapping from account IDs to the hash of the code they reference
        refs: Mapping<AccountId, Hash>,
    }

    // Helper functions
    impl Codebase {
        /// Ensures that the caller is a manager
        /// Returns an error if the caller is not a manager.
        fn ensure_manager(&self) -> Result<()> {
            let caller = self.env().caller();
            if self.managers.contains(&caller) {
                Ok(())
            } else {
                error!("Access denied for caller: {caller:?}");
                Err(Error::BadOrigin)
            }
        }

        /// Ensures that the caller is a contract, not an EOA (Externally Owned Account)
        /// Returns the caller's account ID if it is a contract.
        fn ensure_from_contract(&self) -> Result<AccountId> {
            let caller = self.env().caller();
            if self.env().is_contract(&caller) {
                Ok(caller)
            } else {
                error!("Caller is not a contract: {caller:?}");
                Err(Error::BadOrigin)
            }
        }
    }

    // Main functionalities of the contract
    impl Codebase {
        /// Constructor to create a new codebase contract
        /// Initializes the manager to the caller and sets default base information.
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            info!("Creating new codebase with manager: {caller:?}");
            Self {
                managers: vec![caller],
                base_info: BaseInfo::default(),
                metadatas: Mapping::new(),
                codes: Mapping::new(),
                refs: Mapping::new(),
            }
        }

        /// Retrieves the current version of the contract
        #[ink(message)]
        pub fn version(&self) -> this_crate::VersionTuple {
            this_crate::version_tuple!()
        }

        /// Provides the list of managers for this contract
        #[ink(message)]
        pub fn managers(&self) -> Vec<AccountId> {
            self.managers.clone()
        }

        /// Allows the manager to upgrade the contract
        /// Fails if the caller is not a manager or if the new code hash is not found.
        #[ink(message)]
        pub fn self_upgrade(&mut self, code_hash: Hash) -> Result<()> {
            self.ensure_manager()?;
            self.env()
                .set_code_hash(&code_hash)
                .or(Err(Error::CodeNotFound))
        }

        /// Fetches basic information about the codebase
        #[ink(message)]
        pub fn info(&self) -> BaseInfo {
            self.base_info.clone()
        }

        /// Sets the maximum size allowed for a single piece of code
        /// Can only be called by a manager.
        #[ink(message)]
        pub fn set_max_code_size(&mut self, max_code_size: u64) -> Result<()> {
            self.ensure_manager()?;
            info!("Setting max code size to: {max_code_size:?}");
            self.base_info.max_code_size = max_code_size;
            Ok(())
        }

        /// Sets the total capacity allowed for storing codes
        /// Can only be called by a manager.
        #[ink(message)]
        pub fn set_capacity(&mut self, capacity: u64) -> Result<()> {
            self.ensure_manager()?;
            info!("Setting total capacity to: {capacity:?}");
            self.base_info.capacity = capacity;
            Ok(())
        }

        /// Allows uploading of a new piece of code
        /// Checks for size constraints and updates metadata accordingly.
        #[ink(message)]
        pub fn upload(&mut self, code: String) -> Result<Hash> {
            if code.as_bytes().len() as u64 > self.base_info.max_code_size {
                error!("Uploaded code exceeds maximum size limit.");
                return Err(Error::CodeTooLarge);
            }
            let code_hash: Hash = self.env().hash_bytes::<Blake2x256>(code.as_bytes()).into();
            if self.codes.contains(code_hash) {
                info!("Code already exists. Returning existing hash.");
                return Ok(code_hash);
            }
            if self.metadatas.contains(code_hash) {
                info!("Metadata already exists for the code. Returning hash.");
                return Ok(code_hash);
            }
            if self.base_info.total_size.saturating_add(code.len() as u64) > self.base_info.capacity
            {
                error!("Uploading code exceeds total capacity.");
                return Err(Error::CapacityExceeded);
            }
            let metadata = CodeMetadata {
                ref_cnt: 0,
                uploaded_at_block: Self::env().block_number(),
            };
            self.metadatas.insert(code_hash, &metadata);
            self.codes.insert(code_hash, &code);
            self.env().emit_event(CodeUploaded {
                code_hash,
                uploader: Self::env().caller(),
            });
            self.base_info.count = self.base_info.count.saturating_add(1);
            self.base_info.total_size = self.base_info.total_size.saturating_add(code.len() as u64);
            info!("Code uploaded successfully. Hash: {code_hash:?}");
            Ok(code_hash)
        }

        /// Function to remove one or more codes from the codebase
        /// Can be forced to bypass reference count checks. Can only be called by a manager.
        #[ink(message)]
        pub fn remove_codes(&mut self, codes: Vec<Hash>, force: bool) -> Result<()> {
            self.ensure_manager()?;
            let mut removed = vec![];
            for code_hash in codes {
                let Some(metadata) = self.metadatas.take(code_hash) else {
                    info!("Removing code hash not found: {code_hash:?}");
                    continue;
                };
                if metadata.ref_cnt > 0 {
                    if !force {
                        error!(
                            "Cannot remove code with non-zero reference count. Hash: {code_hash:?}"
                        );
                        self.metadatas.insert(code_hash, &metadata);
                        continue;
                    } else {
                        info!("Removing code with non-zero reference count. Hash: {code_hash:?}");
                    }
                }
                let code = self.codes.take(code_hash);
                self.base_info.count = self.base_info.count.saturating_sub(1);
                let code_size = code.map(|c| c.len()).unwrap_or_default() as u64;
                self.base_info.total_size = self.base_info.total_size.saturating_sub(code_size);
                removed.push(code_hash);
            }
            self.env().emit_event(CodesRemoved { codes: removed });
            info!("Codes removed successfully.");
            Ok(())
        }

        /// Function to associate a code as used by a contract
        /// Updates reference counts and emits events accordingly.
        ///
        /// Later `get_code` calls from the same contract will return the associated code.
        #[ink(message)]
        pub fn use_code(&mut self, code_hash: Hash) -> Result<()> {
            let caller = self.ensure_from_contract()?;
            let mut metadata = self.metadatas.take(code_hash).ok_or(Error::CodeNotFound)?;
            if let Some(old_code) = self.refs.take(caller) {
                if let Some(mut metadata) = self.metadatas.take(old_code) {
                    metadata.ref_cnt = metadata.ref_cnt.saturating_sub(1);
                    self.metadatas.insert(old_code, &metadata);
                    if metadata.ref_cnt == 0 {
                        self.env().emit_event(CodeBecomeUnused {
                            code_hash: old_code,
                        });
                    }
                    self.base_info.total_ref_cnt = self.base_info.total_ref_cnt.saturating_sub(1);
                }
            }
            metadata.ref_cnt = metadata.ref_cnt.saturating_add(1);
            self.metadatas.insert(code_hash, &metadata);
            self.refs.insert(caller, &code_hash);
            self.base_info.total_ref_cnt = self.base_info.total_ref_cnt.saturating_add(1);
            info!("Code {code_hash:?} marked as used by {caller:?}.");
            Ok(())
        }

        /// Retrieves the code associated with the caller's account
        /// Returns None if the caller has no associated code.
        #[ink(message)]
        pub fn get_code(&self) -> Option<String> {
            let caller = self.env().caller();
            let code_hash = self.refs.get(caller)?;
            self.codes.get(code_hash)
        }
    }

    impl PhatCodeProvider for Codebase {
        #[ink(message)]
        fn upload_code(&mut self, code: String) -> Result<Hash> {
            self.upload(code)
        }

        #[ink(message)]
        fn use_code(&mut self, code_hash: Hash) -> Result<()> {
            self.use_code(code_hash)
        }

        #[ink(message)]
        fn get_code(&self) -> Option<String> {
            self.get_code()
        }
    }
}
