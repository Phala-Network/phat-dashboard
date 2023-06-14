use std::env;
use std::process::Command;

fn main() {
    // The following commands works with cargo check but does not work with cargo contract build.
    //
    // let manifest_dir = env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR env var is not set");
    // let command_string = format!("cd {manifest_dir}/js && yarn && yarn build");
    //
    // Workaround:
    let manifest_dir =
        env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR env var is not set");
    let command_string = if std::path::Path::new(&manifest_dir).join("js").exists() {
        format!("cd {manifest_dir}/js && yarn && yarn build")
    } else {
        let root_dir = env::var("OLDPWD").expect("OLDPWD env var is not set");
        format!("cd {root_dir}/phat/contracts/lego/js && yarn && yarn build")
    };

    let status = Command::new("sh")
        .arg("-c")
        .arg(command_string)
        .status()
        .expect("Failed to execute command");

    if !status.success() {
        panic!("Command executed with failure");
    }
}
