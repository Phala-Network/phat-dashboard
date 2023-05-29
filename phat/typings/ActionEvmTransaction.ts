import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace ActionEvmTransaction {
    type InkPrimitives_Types_AccountId$1 = any;
    type InkPrimitives_LangError$4 = {
        CouldNotReadInput? : null
        };
    type Result$2 = {
        Ok? : never[],
        Err? : InkPrimitives_LangError$4
        };
    type Result$5 = {
        Ok? : [ number, number, number ],
        Err? : InkPrimitives_LangError$4
        };
    type Result$7 = {
        Ok? : InkPrimitives_Types_AccountId$1,
        Err? : InkPrimitives_LangError$4
        };
    type ActionEvmTransaction_ActionEvmTransaction_Error$10 = {
        BadOrigin? : null,
        NotConfigured? : null,
        BadAbi? : null,
        BadParams? : string,
        BadToAddress? : null,
        BadTransaction? : null,
        FailedToSendTransaction? : null
        };
    type Result$9 = {
        Ok? : string,
        Err? : ActionEvmTransaction_ActionEvmTransaction_Error$10
        };
    type Result$8 = {
        Ok? : Result$9,
        Err? : InkPrimitives_LangError$4
        };
    type Result$12 = {
        Ok? : never[],
        Err? : ActionEvmTransaction_ActionEvmTransaction_Error$10
        };
    type Result$11 = {
        Ok? : Result$12,
        Err? : InkPrimitives_LangError$4
        };
    type Result$14 = {
        Ok? : number[] | string,
        Err? : ActionEvmTransaction_ActionEvmTransaction_Error$10
        };
    type Result$13 = {
        Ok? : Result$14,
        Err? : InkPrimitives_LangError$4
        };
    type PrimitiveTypes_H256$17 = any;
    type Result$16 = {
        Ok? : PrimitiveTypes_H256$17,
        Err? : ActionEvmTransaction_ActionEvmTransaction_Error$10
        };
    type Result$15 = {
        Ok? : Result$16,
        Err? : InkPrimitives_LangError$4
        };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Version extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$5>>>;
        }

        export interface Owner extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$7>>>;
        }

        export interface GetRpc extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$8>>>;
        }

        export interface BuildTransaction extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, to: string, abi: number[] | string, func: string, params: number[] | string[]): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$13>>>;
        }

        export interface MaybeSendTransaction extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, rlp: number[] | string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$15>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        owner: ContractQuery.Owner;
        getRpc: ContractQuery.GetRpc;
        buildTransaction: ContractQuery.BuildTransaction;
        maybeSendTransaction: ContractQuery.MaybeSendTransaction;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface Config extends DPT.ContractTx {
            (options: ContractOptions, rpc: string): DPT.SubmittableExtrinsic;
        }
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
        config: ContractTx.Config;
    }

    /** */
    /** Contract */
    /** */
    export declare class Contract extends DPT.Contract {
        get query(): MapMessageQuery;
        get tx(): MapMessageTx;
    }

    /** */
    /** Contract factory */
    /** */
    export declare class Factory extends DevPhase.ContractFactory {
        instantiate<T = Contract>(constructor: "default", params: never[], options?: DevPhase.InstantiateOptions): Promise<T>;
    }
}
