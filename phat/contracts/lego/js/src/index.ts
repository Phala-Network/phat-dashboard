import "@phala/pink-env";
import { TypeRegistry } from "@phala/pink-env";

declare global {
  var debugWorkflow: boolean;
}

function doEval(script: string, input: any, context: any): any {
  function numToUint8Array32(num: number) {
    let arr = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      arr[i] = num % 256;
      num = Math.floor(num / 256);
    }
    return arr;
  }
  return eval(script);
}

(function () {
  const $pink = globalThis.pink;
  const $ = $pink.SCALE;

  type HexString = `0x${string}`;
  interface BaseAction {
    name?: string;
    input?: any;
  }

  interface ActionLog extends BaseAction {
    cmd: "log";
  }

  interface ActionEval extends BaseAction {
    cmd: "eval";
    config: string;
  }

  interface ActionFetch extends BaseAction {
    cmd: "fetch";
    config?: string | FetchConfig;
  }

  interface ActionCall extends BaseAction {
    cmd: "call";
    config: {
      callee: HexString | Uint8Array;
      selector: number;
      codec?: {
        inputs: number[];
        output: number;
      };
    };
  }

  interface FetchConfig {
    url?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS";
    headers?: Record<string, string>;
    body?: string | Uint8Array;
    allowNon2xx?: boolean;
    returnTextBody?: boolean;
  }

  interface ActionScale extends BaseAction {
    cmd: "scale";
    config: {
      subcmd: "encode" | "decode";
      type: number[] | number;
    };
  }

  type Action = ActionLog | ActionEval | ActionFetch | ActionCall | ActionScale;

  function actionFetch(action: ActionFetch, input: any): any {
    let base: FetchConfig;
    if (typeof action.config === "string") {
      base = { url: action.config };
    } else {
      base = action.config;
    }
    let req: FetchConfig = {};
    if (typeof input === "string" || typeof input === "object") {
      if (typeof input === "string" && input.length > 0) {
        req = { url: input };
      } else {
        req = input;
      }
    }
    req = {
      ...base,
      ...req,
    };
    const { url, method, headers, body, returnTextBody } = req;
    if (typeof url !== "string") {
      throw new Error("invalid url");
    }
    const response = $pink.httpRequest({
      url,
      method,
      headers,
      body,
      returnTextBody,
    });
    if (
      !req.allowNon2xx &&
      (response.statusCode < 200 || response.statusCode >= 300)
    ) {
      throw new Error(`http request failed: ${response.statusCode}`);
    }
    return response;
  }

  function encode(
    input: any,
    type: number | number[],
    typeRegistry: TypeRegistry
  ) {
    const codec = $.codec(type, typeRegistry);
    return codec.encode(input);
  }

  function decode(
    input: any,
    type: number | number[],
    typeRegistry: TypeRegistry
  ) {
    const codec = $.codec(type, typeRegistry);
    return codec.decode(input);
  }

  function actionCall(
    action: ActionCall,
    input: any,
    typeRegistry: TypeRegistry
  ): Uint8Array {
    const args = action.config;
    const codec = action.config.codec;
    if (codec?.inputs !== undefined) {
      input = encode(input, codec.inputs, typeRegistry);
      if (debugWorkflow) {
        console.log(`encoded call input: ${hex(input)}`);
      }
    }
    let output = $pink.invokeContract({
      ...args,
      input,
    });
    if (debugWorkflow) {
      console.log(`call output: ${repr(output)}`);
    }
    if (codec?.output !== undefined) {
      output = decode(output, codec.output, typeRegistry);
    }
    return output;
  }

  function actionEval(action: ActionEval, input: any, context: any): any {
    const script = action.config;
    if (typeof script !== "string") {
      throw new Error("Trying to eval non-string");
    }
    return doEval(script, input, context);
  }

  function actionScale(
    action: ActionScale,
    input: any,
    typeRegistry: TypeRegistry
  ): any {
    const { subcmd, type } = action.config;
    const codec = $.codec(type, typeRegistry);
    if (subcmd === "encode") {
      return codec.encode(input);
    } else if (subcmd === "decode") {
      return codec.decode(input);
    } else {
      throw new Error(`unknown scale subcmd: ${subcmd}`);
    }
  }

  function runAction(context: any, action: Action, input: any): any {
    switch (action.cmd) {
      case "call":
        return actionCall(action, input, context.typeRegistry);
      case "eval":
        return actionEval(action, input, context);
      case "fetch":
        return actionFetch(action, input);
      case "scale":
        return actionScale(action, input, context.typeRegistry);
      case "log":
        return input;
      default:
        throw new Error(`unknown action: ${(<any>action).cmd}`);
    }
  }

  function pipeline(workflowJson: string): void {
    const workflow = JSON.parse(workflowJson);
    const version = workflow.version;

    globalThis.debugWorkflow = workflow.debug || false;

    if (version !== 1) {
      throw new Error(`unsupported workflow version: ${version}`);
    }
    const actions = workflow.actions;
    const typeRegistry = $.parseTypes(workflow.types);

    let input: any = "";
    let context: any = {
      typeRegistry,
    };

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action.input !== undefined) {
        input = action.input;
      }
      const name = action.name ?? action.cmd;
      if (debugWorkflow) {
        console.log(`running action [${name}], ${action.cmd}(input=${repr(input)})`);
      }
      const output = runAction(context, action, input);
      input = output;
      if (action.name?.length > 0) {
        context[name] = { output };
      }
    }
  }
  pipeline(scriptArgs[0]);
  console.log("workflow done");
})();

type AnyObject = {
  [key: string]: any;
};

function hex(bytes: Uint8Array | number[]): string {
  const hexString =
    "0x" +
    Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  return hexString;
}

function replaceBnWzStr(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (obj instanceof Uint8Array) {
    return hex(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceBnWzStr(item));
  }

  if (typeof obj === "object" && obj !== null) {
    const newObj: AnyObject = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = replaceBnWzStr(value);
    }
    return newObj;
  }

  return obj;
}

function repr(obj: any): any {
  try {
    return JSON.stringify(replaceBnWzStr(obj));
  } catch (e) {
    return obj;
  }
}
