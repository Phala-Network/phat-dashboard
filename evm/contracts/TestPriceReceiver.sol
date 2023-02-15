// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import "./PhatRollupReceiver.sol";

contract TestPriceReceiver is PhatRollupReceiver {
    address[] recvFroms;
    bytes[] recvActions;

    event PriceReceived(uint256 price);

    function onPhatRollupReceived(address from, bytes calldata action)
        public override returns(bytes4)
    {
        recvFroms.push(from);
        recvActions.push(action);

        require(action.length == 3, "cannot parse action");
        uint256 data = abi.decode(action, (uint256));
        emit PriceReceived(data);

        return ROLLUP_RECEIVED;
    }

    function getRecvLength() public view returns (uint) {
        return recvFroms.length;
    }

    function getRecv(uint i) public view returns (address, bytes memory) {
        return (recvFroms[i], recvActions[i]);
    }
}
