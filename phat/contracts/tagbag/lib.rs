#![cfg_attr(not(feature = "std"), no_std, no_main)]
extern crate alloc;

#[ink::contract]
mod tagbag {
    use alloc::string::String;
    use alloc::vec::Vec;

    #[ink(storage)]
    #[derive(Default)]
    pub struct TagBag {
        tags: Vec<String>,
    }

    impl TagBag {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }
        #[ink(constructor)]
        pub fn default() -> Self {
            Default::default()
        }
    }

    impl logging::TagStack for TagBag {
        #[ink(message)]
        fn push_tag(&mut self, tag: String) {
            if pink::ext().is_in_transaction() {
                return;
            }
            self.tags.push(tag);
        }

        #[ink(message)]
        fn pop_tag(&mut self) {
            if pink::ext().is_in_transaction() {
                return;
            }
            _ = self.tags.pop();
        }

        #[ink(message)]
        fn tags(&self) -> Vec<String> {
            self.tags.clone()
        }
    }
}
