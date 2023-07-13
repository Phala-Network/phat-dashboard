import './polyfills.js'
import '@phala/pink-env'
import * as scaleCore from '@scale-codec/core'

const pink = globalThis.pink

type HexString = `0x${string}`
interface BaseAction {
  name?: string
  input?: any
}

interface ActionLog extends BaseAction {
  cmd: 'log'
}

interface ActionEval extends BaseAction {
  cmd: 'eval'
  config: string
}

interface ActionFetch extends BaseAction {
  cmd: 'fetch'
  config?: string | FetchConfig
}

interface ActionCall extends BaseAction {
  cmd: 'call'
  config: {
    callee: HexString | Uint8Array
    selector: number
  }
}

interface FetchConfig {
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
  headers?: Record<string, string>
  body?: string | Uint8Array
  allowNon2xx?: boolean
  returnTextBody?: boolean
}

type Action = ActionLog | ActionEval | ActionFetch | ActionCall

function actionFetch(action: ActionFetch, input: any): any {
  let base: FetchConfig
  if (typeof action.config === 'string') {
    base = { url: action.config }
  } else {
    base = action.config
  }
  let req: FetchConfig = {}
  if (typeof input === 'string' || typeof input === 'object') {
    if (typeof input === 'string' && input.length > 0) {
      req = { url: input }
    } else {
      req = input
    }
  }
  req = {
    ...base,
    ...req
  }
  const { url, method, headers, body, returnTextBody } = req
  if (typeof url !== 'string') {
    throw new Error(
      'fetching with invalid url'
    )
  }
  const response = pink.httpRequest({ url, method, headers, body, returnTextBody })
  if (
    !req.allowNon2xx &&
    (response.statusCode < 200 || response.statusCode >= 300)
  ) {
    throw new Error(
      `http request failed with status code ${response.statusCode}`
    )
  }
  return response
}

function actionCall(action: ActionCall, input: Uint8Array): Uint8Array {
  const args = action.config
  const output = pink.invokeContract({
    ...args,
    input
  })
  return output
}

function actionEval(action: ActionEval, input: any, context: any): any {
  const script = action.config
  if (typeof script !== 'string') {
    throw new Error('Trying to eval non-string')
  }

  // pub fn build_transaction(
  //   &self,
  //   to: String,
  //   abi: Vec<u8>,
  //   func: String,
  //   params: Vec<Vec<u8>>,
  // )
  type Tuple = [string, number[], string, (number[])[]];
  const encodeBuildTx = scaleCore.createTupleEncoder<Tuple>([scaleCore.encodeStr, scaleCore.createVecEncoder(scaleCore.encodeU8), scaleCore.encodeStr, scaleCore.createVecEncoder(scaleCore.createVecEncoder(scaleCore.encodeU8))]);

  const decodeResultVecU8 = scaleCore.createResultDecoder<number[], any>(
    scaleCore.createVecDecoder(scaleCore.decodeU8),
    scaleCore.createEnumDecoder({
      0: 'BadOrigin',
      1: 'NotConfigured',
      2: 'BadAbi',
      3: 'BadParams',
      4: 'BadToAddress',
      5: 'BadTransaction',
      6: 'FailedToSendTransaction'
    })
  );

  const scale = {
    encode: scaleCore.WalkerImpl.encode,
    decode: scaleCore.WalkerImpl.decode,
    encodeU128: scaleCore.encodeU128,
    encodeU64: scaleCore.encodeU64,
    encodeU32: scaleCore.encodeU32,
    encodeU16: scaleCore.encodeU16,
    encodeUint8Vec: scaleCore.encodeUint8Vec,
    encodeStr: scaleCore.encodeStr,
    encodeBuildTx: encodeBuildTx,
    encodeVecU8: scaleCore.createVecEncoder(scaleCore.encodeU8),
    decodeResultVecU8: decodeResultVecU8,
    createStructEncoder: scaleCore.createStructEncoder,
    createEnumEncoder: scaleCore.createEnumEncoder
  }

  function numToUint8Array32(num: number) {
    let arr = new Uint8Array(32);

    for (let i = 0; i < 32; i++) {
      arr[i] = num % 256;
      num = Math.floor(num / 256);
    }

    return arr;
  }

  return eval(script)
}

function runAction(context: any, action: Action, input: any): any {
  switch (action.cmd) {
    case 'call':
      return actionCall(action, input)
    case 'eval':
      return actionEval(action, input, context)
    case 'fetch':
      return actionFetch(action, input)
    case 'log':
      return input
    default:
      throw new Error(`unknown action: ${(<any>action).cmd}`)
  }
}

function pipeline(actions: Action[], initInput: string): void {
  let input: any = initInput
  let context: any = {}
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]
    if (action.input !== undefined) {
      input = action.input
    }
    const name = action.name ?? action.cmd
    console.log(`running action [${name}], ${action.cmd}(input=${input})`)
    const output = runAction(context, action, input)
    input = output
    if (action.name?.length > 0) {
      context[name] = { output }
    }
  }
}

(function () {
  console.log(`Actions: ${scriptArgs[0]}`)
  // TODO: Is there a simple way to dynamic validate the external json value against the ts type definition?
  const actions = JSON.parse(scriptArgs[0])
  const input = scriptArgs[1]
  pipeline(actions, input)
})()
