#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

use ink_lang as ink;

#[ink::contract]
mod lego {
    use pink_extension::ResultExt;
    use alloc::string::String;

    #[ink(storage)]
    pub struct Lego {}

    impl Lego {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {}
        }

        #[ink(message)]
        pub fn run(&self, actions: String) -> bool {
            let script = include_str!("./js/dist/index.js");
            crate::js::eval(script, &[actions]).log_err("Failed to run actions").is_ok()
        }
    }
}

mod js {
    use super::*;

    use alloc::string::String;
    use alloc::vec::Vec;
    use pink_extension as pink;
    use scale::{Decode, Encode};

    #[derive(Debug, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Output {
        String(String),
        Bytes(Vec<u8>),
    }

    pub fn eval(script: &str, args: &[String]) -> Result<Output, String> {
        use ink_env::call;
        let system = pink::system::SystemRef::instance();
        let delegate = system
            .get_driver("JsDelegate".into())
            .ok_or("No JS driver found")?;

        let result = call::build_call::<pink::PinkEnvironment>()
            .call_type(call::DelegateCall::new().code_hash(delegate.convert_to()))
            .exec_input(
                call::ExecutionInput::new(call::Selector::new(0x49bfcd24_u32.to_be_bytes()))
                    .push_arg(script)
                    .push_arg(args),
            )
            .returns::<Result<Output, String>>()
            .fire();
        pink::info!("eval result: {result:?}");
        result.unwrap()
    }

    pub trait ConvertTo<To> {
        fn convert_to(&self) -> To;
    }

    impl<F, T> ConvertTo<T> for F
    where
        F: AsRef<[u8; 32]>,
        T: From<[u8; 32]>,
    {
        fn convert_to(&self) -> T {
            (*self.as_ref()).into()
        }
    }
}
