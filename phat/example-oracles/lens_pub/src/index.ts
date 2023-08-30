import "@phala/pink-env";
import { Coders, Result } from "@phala/ethers";

if (globalThis.pink === undefined) {
  // Mock it to run in nodejs
  globalThis.scriptArgs = [
    "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000630783132333400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "https://api.lens.dev/"
  ];
  globalThis.pink = {
    batchHttpRequest(args: {
      url: string;
      method?: string;
      headers?: Headers;
      body?: Uint8Array | string;
      returnTextBody?: boolean;
    }[], timeout_ms?: number) {
      return [
        {
          statusCode: 200,
          body: JSON.stringify({
            "data": {
              "profiles": {
                "items": [
                  {
                    "id": "0xf158",
                    "name": "parents",
                    "bio": null,
                    "attributes": [
                      {
                        "displayType": "string",
                        "traitType": null,
                        "key": "app",
                        "value": "LensClaimingApp"
                      }
                    ],
                    "followNftAddress": "0x5454995a2410638F32Ea936db489E677B28138Ae",
                    "metadata": "ipfs://QmS7ozG7Rr9A8XgdnTXikTXn4k29oyhwnMgUzLPwXVnD3u",
                    "isDefault": true,
                    "picture": {
                      "original": {
                        "url": "https://ik.imagekit.io/lens/media-snapshot/63219e4176f5b97d685f3f2642c48743d57a9c88be6299ed74a19abdcfb9c183.png",
                        "mimeType": null
                      },
                      "__typename": "MediaSet"
                    },
                    "handle": "parents.lens",
                    "coverPicture": null,
                    "ownedBy": "0xe23a56D498B3B531e1d33E0955fdE58b3Dff5726",
                    "dispatcher": {
                      "address": "0x112b57A293d99b79Fe360Af042bb3bfFc824Ab3a",
                      "canUseRelay": true
                    },
                    "stats": {
                      "totalFollowers": 3,
                      "totalFollowing": 27,
                      "totalPosts": 13,
                      "totalComments": 9,
                      "totalMirrors": 30,
                      "totalPublications": 52,
                      "totalCollects": 0
                    },
                    "followModule": null
                  }
                ],
                "pageInfo": {
                  "prev": "{\"offset\":0}",
                  "next": "{\"offset\":1}",
                  "totalCount": 6
                }
              }
            }
          }),
        },
      ];
    },
  } as any;
}

// eth abi coder
const uintCoder = new Coders.NumberCoder(32, false, "uint256");
const bytesCoder = new Coders.BytesCoder("bytes");

// Based on evm/contracts/TestLensPubOracle.sol, the request is like
//  {
//    uint reqId;
//    uint reqType;
//    string id;
//    string cursor;
//  }
function decodeRequest(req: string): Result {
  return Coders.decode([uintCoder, uintCoder, bytesCoder, bytesCoder], req);
}
// and response should be like (uint respType, uint id, string data)
function encodeReply(reply: [number, number, number]): string {
  return Coders.encode([uintCoder, uintCoder, uintCoder], reply);
}

const TYPE_PUB_WHO_MIRRORED = 0;
const TYPE_PUB_WHO_COMMENTED = 1;
const TYPE_PROFILE_STATS = 2;
const TYPE_ERROR = 100;

enum Error {
  BadRlpString = "BadRlpString",
  UnsupportedRequestType = "UnsupportedRequestType",
  BadLensProfileId = "BadLensProfileId",
  LensPubNotFound = "LensPubNotFound",
  FailedToFetchData = "FailedToFetchData",
  FailedToDecode = "FailedToDecode",
  FailedToEncodeReply = "FailedToEncodeReply",
  MalformedRequest = "MalformedRequest",
}

function errorToCode(error: Error): number {
  switch (error) {
    case Error.BadRlpString:
      return 1;
    case Error.UnsupportedRequestType:
      return 2;
    case Error.BadLensProfileId:
      return 3;
    case Error.LensPubNotFound:
      return 4;
    case Error.FailedToFetchData:
      return 5;
    case Error.FailedToDecode:
      return 6;
    case Error.FailedToEncodeReply:
      return 7;
    case Error.MalformedRequest:
      return 8;
    default:
      return 0;
  }
}

function isHexString(str: string): boolean {
  const regex = /^0x[0-9a-f]*$/;
  return regex.test(str.toLowerCase());
}

function stringToHex(str: string): string {
  var hex = "";
  for (var i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  return "0x" + hex;
}

function parseRlpString(hexx: string): string {
  var hex = hexx.toString();
  if (!isHexString(hex)) {
    throw Error.BadRlpString;
  }
  hex = hex.slice(2);
  var str = "";
  for (var i = 0; i < hex.length; i += 2) {
    const ch = String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    str += ch;
  }
  return str;
}

function fetchWhoMirroredPub(lensApi: string, pubId: string, cursor?: string): any {
  let headers = {
    "Content-Type": "application/json",
    "User-Agent": "phat-contract",
  };
  let request = cursor ? `{ whoMirroredPublicationId: \"${pubId}\" cursor: \"${cursor}\"  limit: 1 }` : `{ whoMirroredPublicationId: \"${pubId}\" limit: 1 }`;
  console.log(`Lens request ${request}`);
  let query = JSON.stringify({
    query: `query Profiles {
      profiles(request: ${request}) {
        items {
          id
          name
          bio
          attributes {
            displayType
            traitType
            key
            value
          }
          followNftAddress
          metadata
          isDefault
          picture {
            ... on NftImage {
              contractAddress
              tokenId
              uri
              verified
            }
            ... on MediaSet {
              original {
                url
                mimeType
              }
            }
            __typename
          }
          handle
          coverPicture {
            ... on NftImage {
              contractAddress
              tokenId
              uri
              verified
            }
            ... on MediaSet {
              original {
                url
                mimeType
              }
            }
            __typename
          }
          ownedBy
          dispatcher {
            address
            canUseRelay
          }
          stats {
            totalFollowers
            totalFollowing
            totalPosts
            totalComments
            totalMirrors
            totalPublications
            totalCollects
          }
          followModule {
            ... on FeeFollowModuleSettings {
              type
              amount {
                asset {
                  symbol
                  name
                  decimals
                  address
                }
                value
              }
              recipient
            }
            __typename
          }
        }
        pageInfo {
          prev
          next
          totalCount
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
      `Fail to read Lens api with status code: ${response.statusCode}, error: ${response.error || response.body
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

function encodeError(rid: number, error: Error): string {
  return encodeReply([TYPE_ERROR, rid, errorToCode(error)]);
}

function handleRequest(rawReq: string, lensApi: string): string {
  console.log(`Handle request: ${rawReq}`);
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
  const reqType = Number(decoded[1]);
  const itemId = parseRlpString(decoded[2] as string);
  const cursor = parseRlpString(decoded[3] as string);

  console.log(`Type ${reqType} request received for pub/profile ${itemId}, cursor ${cursor}`);

  if (reqType == TYPE_PUB_WHO_MIRRORED) {
    try {
      const respData = fetchWhoMirroredPub(lensApi, itemId, cursor);
      let profiles = respData.data.profiles.items;
      let nextCursor = respData.data.profiles.pageInfo.next;
      let profileId, totalFollowers;
      if (profiles.length > 0) {
        profileId = profiles[0].id;
        totalFollowers = profiles[0].stats.totalFollowers;
        console.log("Normal response:", [reqType, rid, profileId, totalFollowers, nextCursor]);
      } else {
        return encodeError(rid, Error.LensPubNotFound);
      }
      // Respond
      return encodeReply([reqType, rid, totalFollowers]);
    } catch (error) {
      if (error === Error.FailedToFetchData) {
        throw error;
      } else {
        // otherwise tell client we cannot process it
        console.log("Error catched:", error);
        return encodeError(rid, Error.FailedToEncodeReply);
      }
    }
  } else if (reqType == TYPE_PUB_WHO_COMMENTED) {

  } else if (reqType == TYPE_PROFILE_STATS) {

  } else {
    console.log("Unsupported request type:", reqType);
    return encodeError(rid, Error.UnsupportedRequestType);
  }
}

function setOutput(output: any) {
  console.log(`Reply: ${output}`);
  (globalThis as any).scriptOutput = output;
}

setOutput(handleRequest(scriptArgs[0], scriptArgs[1]));
