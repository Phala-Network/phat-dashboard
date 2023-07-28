const { spawn } = require("child_process");

export function hex(bytes: Uint8Array | number[]): string {
  const hexString =
    "0x" +
    Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  return hexString;
}

export type Message = {
  contract: string;
  name: string;
  selector: string;
  inputs: number[];
  output: number;
};

type Contract = {
  [key: string]: Message;
};

type Abi = {
  types: string[];
  typeRegistry: string;
  symbols: string[];
  messages: Message[];
  contracts: {
    [key: string]: Contract;
  };
};

export async function loadInkAbi(config: {
  contracts: string[];
  exports: string[];
}): Promise<Abi> {
  const { contracts, exports } = config;
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [
      "./scripts/lego-types.py",
      ...contracts,
      "-k",
      exports.join(","),
      "-j",
    ]);

    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    child.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });
    // Resolve the promise with the parsed ABI when the script finishes
    child.on("close", (code) => {
      if (code === 0) {
        resolve(JSON.parse(output) as Abi);
      } else {
        reject(new Error(`lego-types.py exited with code ${code}`));
      }
    });
  });
}

export function callCfg(callee: string, message: Message): any {
  return {
    callee,
    selector: message.selector,
    codec: {
      inputs: message.inputs,
      output: message.output,
    },
  };
}
