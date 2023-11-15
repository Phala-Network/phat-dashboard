#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[macro_use]
extern crate alloc;

#[ink::contract]
mod codebase {
    use ink::codegen::Env;
    use ink::{env::hash::Blake2x256, storage::Mapping};
    use scale::{Decode, Encode};

    use alloc::string::String;
    use alloc::vec::Vec;

    use pink::{error, info};

    #[cfg(feature = "std")]
    use {ink::storage::traits::StorageLayout, scale_info::TypeInfo};

    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(TypeInfo))]
    pub enum Error {
        BadOrigin,
        CodeNotFound,
        CodeTooLarge,
        CapacityExceeded,
    }

    type Result<T> = core::result::Result<T, Error>;

    #[ink(event)]
    pub struct CodeUploaded {
        #[ink(topic)]
        code_hash: Hash,
        #[ink(topic)]
        uploader: AccountId,
    }

    #[ink(event)]
    pub struct CodeBecomeUnused {
        #[ink(topic)]
        code_hash: Hash,
    }

    #[ink(event)]
    pub struct CodesRemoved {
        codes: Vec<Hash>,
    }

    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(TypeInfo, StorageLayout))]
    struct CodeMetadata {
        ref_cnt: u32,
        uploaded_at_block: u32,
    }

    #[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(TypeInfo, StorageLayout))]
    pub struct BaseInfo {
        /// total count of all codes
        count: u64,
        /// total size of all codes
        total_size: u64,
        /// total ref count of all codes
        total_ref_cnt: u64,
        /// max size of a single code
        max_code_size: u64,
        /// max total size of codes
        capacity: u64,
    }

    impl Default for BaseInfo {
        fn default() -> Self {
            Self {
                count: 0,
                total_size: 0,
                total_ref_cnt: 0,
                max_code_size: 1024 * 1024,
                capacity: 1024 * 1024 * 100,
            }
        }
    }

    #[derive(Default)]
    #[ink(storage)]
    pub struct Codebase {
        managers: Vec<AccountId>,
        base_info: BaseInfo,
        metadatas: Mapping<Hash, CodeMetadata>,
        codes: Mapping<Hash, String>,
        refs: Mapping<AccountId, Hash>,
    }

    impl Codebase {
        fn ensure_manager(&self) -> Result<()> {
            let caller = self.env().caller();
            if self.managers.contains(&caller) {
                Ok(())
            } else {
                Err(Error::BadOrigin)
            }
        }
        fn ensure_from_contract(&self) -> Result<AccountId> {
            let caller = self.env().caller();
            if self.env().is_contract(&caller) {
                Ok(caller)
            } else {
                Err(Error::BadOrigin)
            }
        }
    }

    impl Codebase {
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            Self {
                managers: vec![caller],
                base_info: BaseInfo::default(),
                metadatas: Mapping::new(),
                codes: Mapping::new(),
                refs: Mapping::new(),
            }
        }

        #[ink(message)]
        pub fn version(&self) -> this_crate::VersionTuple {
            this_crate::version_tuple!()
        }

        #[ink(message)]
        pub fn managers(&self) -> Vec<AccountId> {
            self.managers.clone()
        }

        #[ink(message)]
        pub fn self_upgrade(&mut self, code_hash: Hash) -> Result<()> {
            self.ensure_manager()?;
            self.env()
                .set_code_hash(&code_hash)
                .or(Err(Error::CodeNotFound))
        }

        #[ink(message)]
        pub fn base_info(&self) -> BaseInfo {
            self.base_info.clone()
        }

        #[ink(message)]
        pub fn set_max_code_size(&mut self, max_code_size: u64) -> Result<()> {
            self.ensure_manager()?;
            self.base_info.max_code_size = max_code_size;
            Ok(())
        }

        #[ink(message)]
        pub fn set_capacity(&mut self, capacity: u64) -> Result<()> {
            self.ensure_manager()?;
            self.base_info.capacity = capacity;
            Ok(())
        }

        #[ink(message)]
        pub fn upload(&mut self, code: String) -> Result<Hash> {
            self.ensure_manager()?;
            if code.as_bytes().len() as u64 > self.base_info.max_code_size {
                return Err(Error::CodeTooLarge);
            }
            let code_hash: Hash = self.env().hash_bytes::<Blake2x256>(code.as_bytes()).into();
            if self.codes.contains(code_hash) {
                return Ok(code_hash);
            }
            if self.metadatas.get(code_hash).is_some() {
                return Ok(code_hash);
            }
            if self.base_info.total_size.saturating_add(code.len() as u64) > self.base_info.capacity
            {
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
            Ok(code_hash)
        }

        #[ink(message)]
        pub fn remove_codes(&mut self, codes: Vec<Hash>, force: bool) -> Result<()> {
            self.ensure_manager()?;
            for code_hash in codes.iter().cloned() {
                let Some(metadata) = self.metadatas.take(code_hash) else {
                    continue;
                };
                if metadata.ref_cnt > 0 && !force {
                    self.metadatas.insert(code_hash, &metadata);
                    continue;
                }
                let code = self.codes.take(code_hash);
                self.base_info.count = self.base_info.count.saturating_sub(1);
                let code_size = code.map(|c| c.len()).unwrap_or_default() as u64;
                self.base_info.total_size = self.base_info.total_size.saturating_sub(code_size);
            }
            self.env().emit_event(CodesRemoved { codes });
            Ok(())
        }

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
            Ok(())
        }

        #[ink(message)]
        pub fn get_code(&self) -> Option<String> {
            let caller = self.env().caller();
            let code_hash = self.refs.get(caller)?;
            self.codes.get(code_hash)
        }
    }
}
