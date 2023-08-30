// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PhatRollupAnchor.sol";

contract TestLensPubOracle is PhatRollupAnchor, Ownable {
    event ResponseReceived(uint reqId, uint reqType, string id, uint256 value);
    event ErrorReceived(uint reqId, uint reqType, string id, uint256 errno);

    uint constant TYPE_PUB_WHO_MIRRORED = 0;
    uint constant TYPE_PUB_WHO_COMMENTED = 1;
    uint constant TYPE_PROFILE_STATS = 2;
    uint constant TYPE_ERROR = 100;

    struct Request {
        uint reqType;
        string id;
        string cursor;
    }

    mapping(uint => Request) requests;
    uint nextRequest = 1;

    constructor(address phatAttestor) {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, phatAttestor);
    }

    function setAttestor(address phatAttestor) public {
        _grantRole(PhatRollupAnchor.ATTESTOR_ROLE, phatAttestor);
    }

    function requestWhoMirroredPub(string calldata pubId, string calldata cursor) public {
        uint id = nextRequest;
        requests[id] = Request(TYPE_PUB_WHO_MIRRORED, pubId, cursor);
        _pushMessage(abi.encode(id, TYPE_PUB_WHO_MIRRORED, pubId, cursor));
        nextRequest += 1;
    }

    function requestWhoCommentedPub(string calldata pubId, string calldata cursor) public {
        uint id = nextRequest;
        requests[id] = Request(TYPE_PUB_WHO_COMMENTED, pubId, cursor);
        _pushMessage(abi.encode(id, TYPE_PUB_WHO_COMMENTED, pubId, cursor));
        nextRequest += 1;
    }

    function requestProfileStats(string calldata profileId) public {
        uint id = nextRequest;
        string memory cursor = "";
        requests[id] = Request(TYPE_PROFILE_STATS, profileId, cursor);
        _pushMessage(abi.encode(id, TYPE_PROFILE_STATS, profileId, cursor));
        nextRequest += 1;
    }

    function _onMessageReceived(bytes calldata action) internal override {
        // require(action.length == 32 * 3, "cannot parse action");
        (uint respType, uint id, uint256 data) = abi.decode(
            action,
            (uint, uint, uint256)
        );
        if (respType == TYPE_ERROR) {
            emit ErrorReceived(id, requests[id].reqType, requests[id].id, data);
            delete requests[id];
        } else {
            emit ResponseReceived(id, requests[id].reqType, requests[id].id, data);
            delete requests[id];
        }
    }
}
