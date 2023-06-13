use std::env;
use std::process::Command;

fn main() {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR env var is not set");

    let command_string = format!("cd {}/js && yarn && yarn build", manifest_dir);

    let status = Command::new("sh")
        .arg("-c")
        .arg(command_string)
        .status()
        .expect("Failed to execute command");

    if !status.success() {
        panic!("Command executed with failure");
    }
}
