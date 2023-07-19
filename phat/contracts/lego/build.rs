use std::env;
use std::process::Command;

fn main() {
    let manifest_dir =
        env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR env var is not set");
    let status = Command::new("sh")
        .arg("-c")
        .arg(format!("cd {manifest_dir}/js && yarn && yarn build"))
        .status()
        .expect("Failed to execute command");

    if !status.success() {
        panic!("Command executed with failure");
    }
}
