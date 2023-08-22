import "@phala/pink-env";
import { Coders, Result } from "@phala/ethers";

if (globalThis.pink === undefined) {
  // Mock it to run in nodejs
  globalThis.scriptArgs = [
    "0x00000000000000000000000000000000000000000000000000000000000004d2000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000073078303030303200000000000000000000000000000000000000000000000000",
  ];
  globalThis.pink = {
    batchHttpRequest(args: any[], timeout_ms?: number) {
      return [
        {
          statusCode: 200,
          body: JSON.stringify({
            data: {
              profile: {
                stats: {
                  totalCollects: 12345,
                },
              },
            },
          }),
        },
      ];
    },
  } as any;
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

function stringToHex(str: string): string {
  var hex = "";
  for (var i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  return "0x" + hex;
}

function fetchLensApiStats(lensApi: string, profileId: string): any {
  // profile_id should be like 0x0001
  let headers = {
    "Content-Type": "application/json",
    "User-Agent": "phat-contract",
  };
  let query = JSON.stringify({
    query: `query Profile {
            profile(request: { profileId: \"${profileId}\" }) {
                stats {
                    totalFollowers
                    totalFollowing
                    totalPosts
                    totalComments
                    totalMirrors
                    totalPublications
                    totalCollects
                }
            }
        }`,
  });
  let body = stringToHex(query);
  let response = pink.batchHttpRequest(
    [
      {
        url: lensApi,
        method: "POST",
        headers,
        body,
        returnTextBody: true,
      },
    ],
    2000
  )[0];
  if (response.statusCode != 200) {
    console.log(
      `Fail to read Lens api with status code: ${response.statusCode}, error: ${
        response.error || response.body
      }}`
    );
    throw Error.FailedToFetchData;
  }
  let respBody = response.body;
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

function handleRequest(rawReq: string, lensApi: string): string {
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
    const respData = fetchLensApiStats(lensApi, profileId);
    let stats = respData.data.profile.stats.totalCollects;
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

setOutput(handleRequest(scriptArgs[0], scriptArgs[1]));
