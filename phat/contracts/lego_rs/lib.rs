#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[macro_use]
extern crate alloc;

#[ink::contract]
mod lego {
    use crate::raw_bytes::RawBytes;
    use alloc::string::String;
    use alloc::vec::Vec;
    use ink::env::Error;
    use logging::{info, warn};
    use scale::Encode;
    use serde::Deserialize;
    use this_crate::{version_tuple, VersionTuple};

    type Result<T, E = Error> = core::result::Result<T, E>;

    #[derive(Debug, Deserialize)]
    #[serde(tag = "cmd", content = "config")]
    #[serde(rename_all = "camelCase")]
    enum Action {
        Call {
            #[serde(with = "deserialize_hex")]
            callee: [u8; 32],
            selector: u32,
        },
        Log,
    }

    mod deserialize_hex {
        use super::*;

        pub(super) fn deserialize<'de, D>(deserializer: D) -> Result<[u8; 32], D::Error>
        where
            D: serde::Deserializer<'de>,
        {
            let s = String::deserialize(deserializer)?;
            let mut bytes = [0u8; 32];
            hex::decode_to_slice(s.as_str().trim_start_matches("0x"), &mut bytes)
                .map_err(serde::de::Error::custom)?;
            Ok(bytes)
        }
    }

    #[ink(storage)]
    pub struct Lego {}

    impl Lego {
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {}
        }

        #[ink(message)]
        pub fn version(&self) -> VersionTuple {
            version_tuple!()
        }

        #[ink(message)]
        pub fn run(&self, actions: String) -> bool {
            info!("lego_rs: actions={}", actions);
            let Ok(actions) = pink_json::from_str::<Vec<Action>>(&actions) else {
                warn!("failed to parse actions");
                return false;
            };
            pipeline(&actions)
        }
    }

    fn pipeline(actions: &[Action]) -> bool {
        let mut result = String::new();
        for action in actions {
            info!("running action={:?}", action);
            match action {
                Action::Call { callee, selector } => {
                    let res = invoke_contract(From::from(*callee), 0, 0, *selector, &[], false);
                    result = format!("{res:?}");
                }
                Action::Log => {
                    info!("output={}", result);
                    result.clear();
                }
            }
        }
        true
    }

    pub(crate) fn invoke_contract(
        callee: ink::primitives::AccountId,
        gas_limit: u64,
        transferred_value: u128,
        selector: u32,
        input: &[u8],
        allow_reentry: bool,
    ) -> Result<Vec<u8>> {
        use ink::env::call;

        let call_type = call::Call::new(callee)
            .gas_limit(gas_limit)
            .transferred_value(transferred_value);
        let flags = ink::env::CallFlags::default().set_allow_reentry(allow_reentry);
        call::build_call::<pink::PinkEnvironment>()
            .call_type(call_type)
            .call_flags(flags)
            .exec_input(
                call::ExecutionInput::new(call::Selector::new(selector.to_be_bytes()))
                    .push_arg(RawBytes(input)),
            )
            .returns::<RawBytes<Vec<u8>>>()
            .try_invoke()
            .map(|x| x.encode())
    }

    #[test]
    fn can_decode_actions() {
        let json = r#"[{"cmd":"call","config":{"callee":"0x4455e51846f3eae76e6c92f126bef842b8333275d4e253db1af541292575444b","selector":710659445,"input":[]}},{"cmd":"log"}]"#;
        let actions: Vec<Action> = pink_json::from_str(json).unwrap();
        assert_eq!(actions.len(), 2);
    }
}

mod raw_bytes {
    use alloc::vec::Vec;
    use scale::{Decode, Encode};
    pub struct RawBytes<T>(pub T);

    impl Decode for RawBytes<Vec<u8>> {
        fn decode<I: scale::Input>(input: &mut I) -> core::result::Result<Self, scale::Error> {
            let len = input
                .remaining_len()?
                .ok_or("Can not decode RawBytes without length")?;
            let mut decoded = alloc::vec![0; len];
            input.read(&mut decoded)?;
            Ok(RawBytes(decoded))
        }
    }

    impl<T: AsRef<[u8]>> Encode for RawBytes<T> {
        fn size_hint(&self) -> usize {
            self.0.as_ref().len()
        }

        fn encode_to<O: scale::Output + ?Sized>(&self, dest: &mut O) {
            dest.write(self.0.as_ref());
        }

        fn encoded_size(&self) -> usize {
            self.0.as_ref().len()
        }
    }
}
