import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "devphase";
import type * as DPT from "devphase/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace ActionOffchainRollup {
    type InkPrimitives_Types_AccountId = any;
    type InkPrimitives_LangError = { CouldNotReadInput: null };
    type Result = { Ok: Result } | { Err: InkPrimitives_LangError };
    type ActionOffchainRollup_ActionOffchainRollup_Error = { BadOrigin: null } | { NotConfigured: null } | { ClientNotConfigured: null } | { DuplicatedConfigure: null } | { BadAccountContract: null } | { InvalidKeyLength: null } | { InvalidAddressLength: null } | { NoRequestInQueue: null } | { FailedToCreateClient: null } | { FailedToCommitTx: null } | { BadProfileId: null } | { FailedToFetchLensApi: null } | { FailedToTransformLensData: null } | { BadTransformedData: null } | { FailedToGetStorage: null } | { FailedToCreateTransaction: null } | { FailedToSignTransaction: null } | { FailedToSendTransaction: null } | { FailedToGetBlockHash: null } | { FailedToDecode: null } | { InvalidRequest: null };
    type PrimitiveTypes_H160 = any;
    type Option = { None: null } | { Some: number[] };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Owner extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface GetAttestAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface GetTransformJs extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface FetchLensApiStats extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, profile_id: string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface AnswerRequest extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        owner: ContractQuery.Owner;
        getAttestAddress: ContractQuery.GetAttestAddress;
        getTransformJs: ContractQuery.GetTransformJs;
        fetchLensApiStats: ContractQuery.FetchLensApiStats;
        answerRequest: ContractQuery.AnswerRequest;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface Config extends DPT.ContractTx {
            (options: ContractOptions, account_contract: InkPrimitives_Types_AccountId): DPT.SubmittableExtrinsic;
        }

        export interface ConfigClient extends DPT.ContractTx {
            (options: ContractOptions, rpc: string, anchor_addr: number[], lens_api: string, transform_js: string): DPT.SubmittableExtrinsic;
        }

        export interface TransferOwnership extends DPT.ContractTx {
            (options: ContractOptions, new_owner: InkPrimitives_Types_AccountId): DPT.SubmittableExtrinsic;
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
