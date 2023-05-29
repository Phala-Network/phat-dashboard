import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace ActionOffchainRollup {
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
    type ActionOffchainRollup_ActionOffchainRollup_Error$10 = {
        BadOrigin? : null,
        NotConfigured? : null,
        ClientNotConfigured? : null,
        DuplicatedConfigure? : null,
        BadAccountContract? : null,
        InvalidKeyLength? : null,
        InvalidAddressLength? : null,
        NoRequestInQueue? : null,
        FailedToCreateClient? : null,
        FailedToCommitTx? : null,
        BadProfileId? : null,
        FailedToFetchLensApi? : null,
        FailedToTransformLensData? : null,
        BadTransformedData? : null,
        FailedToGetStorage? : null,
        FailedToCreateTransaction? : null,
        FailedToSignTransaction? : null,
        FailedToSendTransaction? : null,
        FailedToGetBlockHash? : null,
        FailedToDecode? : null,
        InvalidRequest? : null
        };
    type Result$9 = {
        Ok? : never[],
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$10
        };
    type Result$8 = {
        Ok? : Result$9,
        Err? : InkPrimitives_LangError$4
        };
    type PrimitiveTypes_H160$13 = any;
    type Result$12 = {
        Ok? : PrimitiveTypes_H160$13,
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$10
        };
    type Result$11 = {
        Ok? : Result$12,
        Err? : InkPrimitives_LangError$4
        };
    type Result$15 = {
        Ok? : string,
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$10
        };
    type Result$14 = {
        Ok? : Result$15,
        Err? : InkPrimitives_LangError$4
        };
    type Option$18 = {
        None? : null,
        Some? : number[] | string
        };
    type Result$17 = {
        Ok? : Option$18,
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$10
        };
    type Result$16 = {
        Ok? : Result$17,
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

        export interface GetAttestAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$11>>>;
        }

        export interface GetTransformJs extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$14>>>;
        }

        export interface AnswerRequest extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$16>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        owner: ContractQuery.Owner;
        getAttestAddress: ContractQuery.GetAttestAddress;
        getTransformJs: ContractQuery.GetTransformJs;
        answerRequest: ContractQuery.AnswerRequest;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface Config extends DPT.ContractTx {
            (options: ContractOptions, account_contract: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }

        export interface ConfigClient extends DPT.ContractTx {
            (options: ContractOptions, rpc: string, anchor_addr: number[] | string, lens_api: string, transform_js: string): DPT.SubmittableExtrinsic;
        }

        export interface TransferOwnership extends DPT.ContractTx {
            (options: ContractOptions, new_owner: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
        config: ContractTx.Config;
        configClient: ContractTx.ConfigClient;
        transferOwnership: ContractTx.TransferOwnership;
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
