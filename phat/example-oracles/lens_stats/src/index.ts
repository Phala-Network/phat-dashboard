import "@phala/pink-env";
import { Coders, Result } from "@phala/ethers";

if (globalThis.scriptArgs === undefined) {
  // Mock it to run in nodejs
  globalThis.scriptArgs = [
    "0x00000000000000000000000000000000000000000000000000000000000004d2000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000043078303100000000000000000000000000000000000000000000000000000000",
    "https://api-v2-mumbai-live.lens.dev"
  ];
}

// eth abi coder
const uintCoder = new Coders.NumberCoder(32, false, "uint256");
const bytesCoder = new Coders.BytesCoder("bytes");

function encodeReply(reply: [number, number, number]): string {
  return Coders.encode([uintCoder, uintCoder, uintCoder], reply);
}

function decodeRequest(req: string): Result {
  return Coders.decode([uintCoder, bytesCoder], req);
}

// Defined in TestLensOracle.sol
const TYPE_RESPONSE = 0;
const TYPE_ERROR = 2;

enum Error {
  BadLensProfileId = "BadLensProfileId",
  FailedToFetchData = "FailedToFetchData",
  FailedToDecode = "FailedToDecode",
  MalformedRequest = "MalformedRequest",
}

function errorToCode(error: Error): number {
  switch (error) {
    case Error.BadLensProfileId:
      return 1;
    case Error.FailedToFetchData:
      return 2;
    case Error.FailedToDecode:
      return 3;
    case Error.MalformedRequest:
      return 4;
    default:
      return 0;
  }
}

function isHexString(str: string): boolean {
  const regex = /^0x[0-9a-f]+$/;
  return regex.test(str.toLowerCase());
}

async function fetchLensApiStats(lensApi: string, profileId: string): Promise<any> {
  // profile_id should be like 0x0001
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "phat-contract",
  };
  const query = JSON.stringify({
    query: `query Profile {
            profile(request: { forProfileId: \"${profileId}\" }) {
                stats {
                    followers
                    posts
                    comments
                    mirrors
                    publications
                }
            }
        }`,
  });
  const response = await fetch(lensApi, {
    method: "POST",
    headers,
    body: query,
  });

  if (response.status != 200) {
    let body = await response.text();
    console.log(`Fail to read Lens api with status code: ${response.status}, body: ${body}`);
    throw Error.FailedToFetchData;
  }
  let respBody = await response.text();
  if (typeof respBody !== "string") {
    throw Error.FailedToDecode;
  }
  return JSON.parse(respBody);
}

function parseProfileId(hexx: string): string {
  var hex = hexx.toString();
  if (!isHexString(hex)) {
    throw Error.BadLensProfileId;
  }
  hex = hex.slice(2);
  var str = "";
  for (var i = 0; i < hex.length; i += 2) {
    const ch = String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    str += ch;
  }
  return str;
}

function encodeError(rid: number, error: Error): string {
  return encodeReply([TYPE_ERROR, rid, errorToCode(error)]);
}

async function main(rawReq: string, lensApi: string): Promise<string> {
  console.log(`handle req: ${rawReq}`);
  let decoded;
  try {
    decoded = decodeRequest(rawReq);
  } catch (error) {
    console.info("Malformed request received");
    // tell client we cannot process it
    return encodeError(0, error);
  }
  console.log(`Decoded request: ${decoded}`);
  const rid = decoded[0];
  const profileId = parseProfileId(decoded[1] as string);

  console.log(`Request received for profile ${profileId}`);

  try {
    const respData = await fetchLensApiStats(lensApi, profileId);
    let stats = respData.data.profile.stats.posts;
    console.log("response:", [TYPE_RESPONSE, rid, stats]);
    // Respond
    return encodeReply([TYPE_RESPONSE, rid, stats]);
  } catch (error) {
    if (error === Error.FailedToFetchData) {
      throw error;
    } else {
      // otherwise tell client we cannot process it
      console.log("error:", [TYPE_ERROR, rid, error]);
      return encodeError(rid, error);
    }
  }
}

function setOutput(output: any) {
  console.log(`Reply: ${output}`);
  (globalThis as any).scriptOutput = output;
}

main(scriptArgs[0], scriptArgs[1])
  .then(setOutput)
  .catch(setOutput)
  .finally(process.exit);
