#![cfg_attr(not(feature = "std"), no_std, no_main)]

extern crate alloc;

#[ink::contract]
mod example {
    use alloc::string::String;
    use codebase_driver::PhatCodeProviderRef;

    #[ink(storage)]
    pub struct Example {}

    impl Example {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {}
        }

        #[ink(message)]
        pub fn set_code(&mut self, code: String) -> Hash {
            let mut code_provider = PhatCodeProviderRef::instance().unwrap();
            let hash = code_provider.upload_code(code).unwrap();
            code_provider.use_code(hash).unwrap();
            hash
        }

        #[ink(message)]
        pub fn get_code(&self) -> Option<String> {
            let code_provider = PhatCodeProviderRef::instance().unwrap();
            code_provider.get_code()
        }
    }

    #[cfg(test)]
    mod tests {
        use ink::codegen::TraitCallBuilder;

        use drink::session::Session;
        use drink_pink_runtime::{Callable, DeployBundle, PinkRuntime, SessionExt};

        use super::ExampleRef;
        use phat_codebase::{BaseInfo, CodebaseRef};

        #[drink::contract_bundle_provider]
        enum BundleProvider {}

        #[drink::test]
        fn it_works() -> Result<(), Box<dyn std::error::Error>> {
            tracing_subscriber::fmt::init();

            let mut session = Session::<PinkRuntime>::new()?;
            let driver_bundle = BundleProvider::PhatCodebase.bundle()?;
            let mut codebase = CodebaseRef::new()
                .salt_bytes(&[])
                .deploy_bundle(&driver_bundle, &mut session)?;
            session.set_driver("PhatCodeProvider", &codebase)?;

            let example_bundle = BundleProvider::local()?;
            let mut example = ExampleRef::new()
                .salt_bytes(&[])
                .deploy_bundle(&example_bundle, &mut session)?;

            // Code should be empty at first
            assert_eq!(example.call().get_code().query(&mut session)?, None);

            // Set code
            let hash_for_hello = example
                .call_mut()
                .set_code("Hello".into())
                .submit_tx(&mut session)?;

            // Now code should be "Hello"
            assert_eq!(
                example.call().get_code().query(&mut session)?,
                Some("Hello".into())
            );

            assert_eq!(
                codebase.call().info().query(&mut session)?,
                BaseInfo {
                    count: 1,
                    total_size: 5,
                    total_ref_cnt: 1,
                    max_code_size: 1048576,
                    capacity: 104857600,
                }
            );

            // Set anothor code
            example
                .call_mut()
                .set_code("Foo".into())
                .submit_tx(&mut session)?;

            // Now code should be "Foo"
            assert_eq!(
                example.call().get_code().query(&mut session)?,
                Some("Foo".into())
            );

            // The old code was unrefed but still in the codebase
            assert_eq!(
                codebase.call().info().query(&mut session)?,
                BaseInfo {
                    count: 2,
                    total_size: 8,
                    total_ref_cnt: 1,
                    max_code_size: 1048576,
                    capacity: 104857600,
                }
            );

            codebase
                .call_mut()
                .remove_codes(alloc::vec![hash_for_hello], false)
                .submit_tx(&mut session)?
                .unwrap();

            // The old code should be removed now
            assert_eq!(
                codebase.call().info().query(&mut session)?,
                BaseInfo {
                    count: 1,
                    total_size: 3,
                    total_ref_cnt: 1,
                    max_code_size: 1048576,
                    capacity: 104857600,
                }
            );
            Ok(())
        }
    }
}
