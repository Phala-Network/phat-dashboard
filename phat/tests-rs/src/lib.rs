#[cfg(test)]
mod tests {
    use ink::primitives::AccountId;
    use ink::{codegen::TraitCallBuilder, env::call::FromAccountId, ToAccountId};

    use drink::session::Session;
    use drink_pink_runtime::{Callable, DeployBundle, PinkRuntime, SessionExt};

    use action_evm_transaction::ActionEvmTransactionRef;
    use action_offchain_rollup::{ActionOffchainRollupRef, Core, JsDriver, JsCode};
    use brick_profile::BrickProfileRef;
    use brick_profile_factory::BrickProfileFactoryRef;
    use lego_rs::LegoRef;
    use phat_codebase::CodebaseRef;
    use tagbag::TagBagRef;

    #[drink::contract_bundle_provider]
    enum BundleProvider {}

    use BundleProvider as BP;

    #[test]
    fn it_works() -> Result<(), Box<dyn std::error::Error>> {
        tracing_subscriber::fmt::init();
        let rpc = std::env::var("RPC").unwrap_or_else(|_| "http://localhost:8545".into());
        let lens_api =
            std::env::var("LENS").unwrap_or_else(|_| "https://api-v2-mumbai-live.lens.dev".into());
        let anchor_addr = std::env::var("ANCHOR")
            .unwrap_or_else(|_| "0xb037f1EDD1474D028984D6594F7E848CDD3FAdE3".into());
        println!("RPC={}", rpc);
        println!("LENS={}", lens_api);
        println!("ANCHOR={}", anchor_addr);
        let anchor_addr =
            hex::decode(anchor_addr.trim_start_matches("0x")).expect("Invalid ANCHOR address");

        let mut session = Session::<PinkRuntime>::new()?;

        // Set up drivers
        let tagbag = TagBagRef::new().deploy_bundle(&BP::Tagbag.bundle()?, &mut session)?;
        session.set_driver("TagStack", &tagbag)?;

        let lego = LegoRef::default().deploy_bundle(&BP::LegoRs.bundle()?, &mut session)?;

        let mut codebase =
            CodebaseRef::new().deploy_bundle(&BP::PhatCodebase.bundle()?, &mut session)?;
        session.set_driver("PhatCodeProvider", &codebase)?;

        // setup BrickProfileFactory
        let brick_profile_bundle = BP::BrickProfile.bundle()?;
        let brick_profile_code_hash = session
            .upload(brick_profile_bundle.wasm)
            .expect("Failed to upload brick profile code");
        println!(
            "brick_profile_code_hash=0x{}",
            hex::encode(brick_profile_code_hash)
        );
        let brick_profile_code_hash = brick_profile_code_hash.0.into();
        let mut profile_factory = BrickProfileFactoryRef::new(brick_profile_code_hash)
            .deploy_bundle(&BP::BrickProfileFactory.bundle()?, &mut session)?;
        assert_eq!(
            profile_factory
                .call()
                .profile_code_hash()
                .query(&mut session)?,
            brick_profile_code_hash
        );

        // STEP 0: create BrickProfile using BrickProfileFactory
        profile_factory
            .call_mut()
            .create_user_profile()
            .submit_tx(&mut session)?
            .expect("Failed to create profile");

        let mut profile_address = profile_factory
            .call()
            .get_user_profile_address()
            .query(&mut session)?
            .expect("No profile address");

        {
            // It can overwrite existing profile

            let last_profile_address = profile_address.clone();

            profile_factory
                .call_mut()
                .force_create_user_profile()
                .submit_tx(&mut session)?
                .expect("Failed to create new profile");

            profile_address = profile_factory
                .call()
                .get_user_profile_address()
                .query(&mut session)?
                .expect("No profile address");
            assert_ne!(last_profile_address, profile_address);
        }
        {
            // It can import profiles

            let old_profiles = vec![
                (AccountId::from([0u8; 32]), AccountId::from([1u8; 32])),
                (AccountId::from([2u8; 32]), AccountId::from([3u8; 32])),
            ];
            profile_factory
                .call_mut()
                .import_user_profiles(old_profiles)
                .submit_tx(&mut session)?
                .expect("Failed to import profiles");

            let all_profiles = profile_factory
                .call()
                .get_user_profiles()
                .query(&mut session)?
                .expect("No profiles found");
            assert_eq!(all_profiles.len(), 3);
        }

        let mut brick_profile = BrickProfileRef::from_account_id(profile_address);

        let mut offchain_rollup = ActionOffchainRollupRef::new(profile_address)
            .deploy_bundle(&BP::ActionOffchainRollup.bundle()?, &mut session)?;
        let mut evm_transaction = ActionEvmTransactionRef::default()
            .deploy_bundle(&BP::ActionEvmTransaction.bundle()?, &mut session)?;

        macro_rules! print_deployed {
            ($name: literal, $var: ident) => {
                println!(
                    "{:<25} deployed at: 0x{}",
                    $name,
                    hex::encode(&$var.to_account_id())
                );
            };
        }

        print_deployed!("BrickProfile", brick_profile);
        print_deployed!("Lego", lego);
        print_deployed!("Codebase", codebase);
        print_deployed!("Tagbag", tagbag);
        print_deployed!("BrickProfileFactory", profile_factory);
        print_deployed!("ActionOffchainRollup", offchain_rollup);
        print_deployed!("ActionEvmTransaction", evm_transaction);

        {
            // It can setup contracts

            // STEP 1: config BrickProfile to the lego contract address
            brick_profile
                .call_mut()
                .config(lego.to_account_id())
                .submit_tx(&mut session)?
                .expect("Failed to config BrickProfile");
            println!("BrickProfile configured");

            // STEP 2: generate the external ETH account, the ExternalAccountId increases from 0
            for _ in 0..2 {
                brick_profile
                    .call_mut()
                    .generate_evm_account(rpc.clone())
                    .submit_tx(&mut session)?
                    .expect("Failed to generate EVM account");
            }
            println!("Two BrickProfile accounts generated");
            evm_transaction
                .call_mut()
                .config(rpc.clone())
                .submit_tx(&mut session)?
                .expect("Failed to config ActionEvmTransaction");
            assert_eq!(
                brick_profile
                    .call()
                    .get_js_runner()
                    .query(&mut session)?
                    .expect("Failed to get js runner"),
                lego.to_account_id()
            );
            assert_eq!(
                brick_profile
                    .call()
                    .external_account_count()
                    .query(&mut session)?,
                2
            );

            let _ = brick_profile
                .call()
                .get_evm_account_address(0)
                .query(&mut session)?
                .expect("Failed to get evm account address");
            println!("ActionEvmTransaction configured");
        }
        {
            // It can update rpc endpoint

            brick_profile
                .call_mut()
                .generate_evm_account(rpc.clone())
                .submit_tx(&mut session)?
                .expect("Failed to generate EVM account");
            assert_eq!(
                brick_profile
                    .call()
                    .external_account_count()
                    .query(&mut session)?,
                3
            );
            let fake_rpc = "https://mock-rpc.com";
            brick_profile
                .call_mut()
                .set_rpc_endpoint(2, fake_rpc.into())
                .submit_tx(&mut session)?
                .expect("Failed to set rpc endpoint");
            assert_eq!(
                brick_profile
                    .call()
                    .get_rpc_endpoint(2)
                    .query(&mut session)?
                    .expect("Failed to get rpc endpoint"),
                fake_rpc
            );
        }
        {
            // It can dump secret key

            brick_profile
                .call()
                .get_dumped_key(2)
                .query(&mut session)?
                .err()
                .expect("Should not get dumped key");
            brick_profile
                .call_mut()
                .dump_evm_account(2)
                .submit_tx(&mut session)?
                .expect("Failed to dump secret key");
            brick_profile
                .call()
                .get_dumped_key(2)
                .query(&mut session)?
                .expect("Failed to get dumped key");
        }

        {
            // It can run rollup-based Oracle

            // STEP 3: assume user has deployed the smart contract client

            let rollup_profile = offchain_rollup
                .call()
                .get_brick_profile_address()
                .query(&mut session)?;
            let rollup_identity = offchain_rollup
                .call()
                .get_attest_address()
                .query(&mut session)?;
            println!(
                "ActionOffchainRollup with identity 0x{} connects to profile 0x{}",
                hex::encode(rollup_identity),
                hex::encode(rollup_profile)
            );

            // config ActionOffchainRollup client
            offchain_rollup
                .call_mut()
                .config_client(anchor_addr)
                .submit_tx(&mut session)?
                .expect("Failed to config ActionOffchainRollup client");
            println!("ActionOffchainRollup client configured");
            let core_js = include_str!("../../example-oracles/lens_stats/dist/index.js");
            let code_hash = codebase
                .call_mut()
                .upload(core_js.into())
                .submit_tx(&mut session)?
                .expect("Failed to upload core.js");
            offchain_rollup
                .call_mut()
                .config_core(Core {
                    driver: JsDriver::AsyncJsRuntime,
                    code_hash,
                    settings: lens_api.clone(),
                })
                .submit_tx(&mut session)?
                .expect("Failed to config core.js");
            offchain_rollup
                .call_mut()
                .config_core_script(JsCode::CodeHash(code_hash))
                .submit_tx(&mut session)?
                .expect("Failed to config core.js");
            let actual_core_js = offchain_rollup
                .call()
                .get_core_script()
                .query(&mut session)?
                .expect("Failed to get core.js");
            assert_eq!(actual_core_js, core_js);
            println!("ActionOffchainRollup core.js configured");

            // STEP 4: add the workflow, the WorkflowId increases from 0
            let selector_answer_request = 0x2a5bcd75_u32;
            let offchain_rollup_address = hex::encode(offchain_rollup.to_account_id());
            let actions = format!(
                r#"
                [
                    {{ "cmd": "call", "config": {{ "callee": "0x{offchain_rollup_address}", "selector": {selector_answer_request} }} }},
                    {{ "cmd": "log" }}
                ]
                "#
            );
            println!("actions={}", actions);

            for i in 0..2 {
                brick_profile
                    .call_mut()
                    .add_workflow(format!("TestRollupOracle_{}", i), actions.clone())
                    .submit_tx(&mut session)?
                    .expect("Failed to add workflow");
                // STEP 5: authorize the workflow to ask for the ETH account signing
                brick_profile
                    .call_mut()
                    .authorize_workflow(i, i)
                    .submit_tx(&mut session)?
                    .expect("Failed to authorize workflow");
                // Check the workflow status
                let _ = brick_profile
                    .call()
                    .get_workflow(i)
                    .query(&mut session)?
                    .expect("Failed to get workflow");
                let authorized_account = brick_profile
                    .call()
                    .get_authorized_account(i)
                    .query(&mut session)?
                    .expect("Failed to get authorized account");
                assert_eq!(authorized_account, i);
            }

            let count = brick_profile.call().workflow_count().query(&mut session)?;
            assert_eq!(count, 2);

            // Poll the workflows for one round
            for i in 0..count {
                let poll_id = format!("POLL_ID_{}", i);
                let ret = brick_profile
                    .call_mut()
                    .poll(i, poll_id)
                    .query(&mut session)?
                    .expect("Failed to poll");
                println!("poll workflow[{i}] output {ret}");
            }
        }

        Ok(())
    }
}
