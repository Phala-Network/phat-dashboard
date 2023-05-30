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
    type PrimitiveTypes_H160$9 = any;
    type Result$8 = {
        Ok? : PrimitiveTypes_H160$9,
        Err? : InkPrimitives_LangError$4
        };
    type ActionOffchainRollup_ActionOffchainRollup_Client$12 = { rpc: string, client_addr: DPT.FixedArray<number, 20> };
    type ActionOffchainRollup_ActionOffchainRollup_Error$13 = {
        BadOrigin? : null,
        ClientNotConfigured? : null,
        DataSourceNotConfigured? : null,
        BadBrickProfile? : null,
        InvalidKeyLength? : null,
        InvalidAddressLength? : null,
        NoRequestInQueue? : null,
        FailedToCreateClient? : null,
        FailedToCommitTx? : null,
        BadLensProfileId? : null,
        FailedToFetchData? : null,
        FailedToTransformData? : null,
        BadTransformedData? : null,
        FailedToGetStorage? : null,
        FailedToCreateTransaction? : null,
        FailedToSignTransaction? : null,
        FailedToSendTransaction? : null,
        FailedToGetBlockHash? : null,
        FailedToDecode? : null,
        InvalidRequest? : null
        };
    type Result$11 = {
        Ok? : ActionOffchainRollup_ActionOffchainRollup_Client$12,
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$13
        };
    type Result$10 = {
        Ok? : Result$11,
        Err? : InkPrimitives_LangError$4
        };
    type ActionOffchainRollup_ActionOffchainRollup_DataSource$16 = { url: string, transform_js: string };
    type Result$15 = {
        Ok? : ActionOffchainRollup_ActionOffchainRollup_DataSource$16,
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$13
        };
    type Result$14 = {
        Ok? : Result$15,
        Err? : InkPrimitives_LangError$4
        };
    type Result$18 = {
        Ok? : never[],
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$13
        };
    type Result$17 = {
        Ok? : Result$18,
        Err? : InkPrimitives_LangError$4
        };
    type Option$21 = {
        None? : null,
        Some? : number[] | string
        };
    type Result$20 = {
        Ok? : Option$21,
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$13
        };
    type Result$19 = {
        Ok? : Result$20,
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
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$8>>>;
        }

        export interface GetBrickProfileAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$7>>>;
        }

        export interface GetClient extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$10>>>;
        }

        export interface GetDataSource extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$14>>>;
        }

        export interface AnswerRequest extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$19>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        owner: ContractQuery.Owner;
        getAttestAddress: ContractQuery.GetAttestAddress;
        getBrickProfileAddress: ContractQuery.GetBrickProfileAddress;
        getClient: ContractQuery.GetClient;
        getDataSource: ContractQuery.GetDataSource;
        answerRequest: ContractQuery.AnswerRequest;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface ConfigClient extends DPT.ContractTx {
            (options: ContractOptions, rpc: string, client_addr: number[] | string): DPT.SubmittableExtrinsic;
        }

        export interface ConfigDataSource extends DPT.ContractTx {
            (options: ContractOptions, url: string, transform_js: string): DPT.SubmittableExtrinsic;
        }

        export interface TransferOwnership extends DPT.ContractTx {
            (options: ContractOptions, new_owner: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
        configClient: ContractTx.ConfigClient;
        configDataSource: ContractTx.ConfigDataSource;
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
        instantiate<T = Contract>(constructor: "new", params: [InkPrimitives_Types_AccountId$1], options?: DevPhase.InstantiateOptions): Promise<T>;
    }
}
