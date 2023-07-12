import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace ActionOffchainRollup {
    type InkPrimitives_Types_AccountId$1 = any;
    type ActionOffchainRollup_ActionOffchainRollup_Client$4 = { rpc: string, client_addr: DPT.FixedArray<number, 20> };
    type Option$3 = {
        None? : null,
        Some? : ActionOffchainRollup_ActionOffchainRollup_Client$4
        };
    type Option$5 = {
        None? : null,
        Some? : [ string, DPT.FixedArray<number, 32> ]
        };
    type Option$7 = {
        None? : null,
        Some? : string
        };
    type ActionOffchainRollup_ActionOffchainRollup_ActionOffchainRollup$2 = { owner: InkPrimitives_Types_AccountId$1, attest_key: DPT.FixedArray<number, 32>, brick_profile: InkPrimitives_Types_AccountId$1, client: Option$3, handler_js: Option$5, handler_settings: Option$7 };
    type InkPrimitives_LangError$10 = {
        CouldNotReadInput? : null
        };
    type Result$8 = {
        Ok? : never[],
        Err? : InkPrimitives_LangError$10
        };
    type Result$11 = {
        Ok? : [ number, number, number ],
        Err? : InkPrimitives_LangError$10
        };
    type Result$13 = {
        Ok? : InkPrimitives_Types_AccountId$1,
        Err? : InkPrimitives_LangError$10
        };
    type PrimitiveTypes_H160$15 = any;
    type Result$14 = {
        Ok? : PrimitiveTypes_H160$15,
        Err? : InkPrimitives_LangError$10
        };
    type ActionOffchainRollup_ActionOffchainRollup_Error$18 = {
        BadOrigin? : null,
        ClientNotConfigured? : null,
        HandlerNotConfigured? : null,
        BadBrickProfile? : null,
        InvalidAddressLength? : null,
        NoRequestInQueue? : null,
        FailedToCreateClient? : null,
        FailedToCommitTx? : null,
        FailedToGetStorage? : null,
        FailedToCreateTransaction? : null,
        FailedToSignTransaction? : null,
        FailedToSendTransaction? : null,
        InvalidJsOutput? : null,
        JsError? : string
        };
    type Result$17 = {
        Ok? : never[],
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$18
        };
    type Result$16 = {
        Ok? : Result$17,
        Err? : InkPrimitives_LangError$10
        };
    type Result$20 = {
        Ok? : ActionOffchainRollup_ActionOffchainRollup_Client$4,
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$18
        };
    type Result$19 = {
        Ok? : Result$20,
        Err? : InkPrimitives_LangError$10
        };
    type Result$21 = {
        Ok? : Option$5,
        Err? : InkPrimitives_LangError$10
        };
    type Result$22 = {
        Ok? : Option$7,
        Err? : InkPrimitives_LangError$10
        };
    type Option$25 = {
        None? : null,
        Some? : number[] | string
        };
    type Result$24 = {
        Ok? : Option$25,
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$18
        };
    type Result$23 = {
        Ok? : Result$24,
        Err? : InkPrimitives_LangError$10
        };
    type Result$27 = {
        Ok? : number[] | string,
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$18
        };
    type Result$26 = {
        Ok? : Result$27,
        Err? : InkPrimitives_LangError$10
        };
    type Result$29 = {
        Ok? : [ number[] | string, DPT.FixedArray<number, 32> ],
        Err? : ActionOffchainRollup_ActionOffchainRollup_Error$18
        };
    type Result$28 = {
        Ok? : Result$29,
        Err? : InkPrimitives_LangError$10
        };
    type InkPrimitives_Types_Hash$31 = any;
    type PinkExtension_ChainExtension_PinkExt$32 = {

        };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Version extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$11>>>;
        }

        export interface Owner extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$13>>>;
        }

        export interface GetAttestAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$14>>>;
        }

        export interface GetBrickProfileAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$13>>>;
        }

        export interface GetClient extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$19>>>;
        }

        export interface GetHandler extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$21>>>;
        }

        export interface GetHandlerSettings extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$22>>>;
        }

        export interface AnswerRequest extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$23>>>;
        }

        export interface GetAnswer extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, request: number[] | string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$26>>>;
        }

        export interface GetRawAnswer extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, request: number[] | string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$28>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        owner: ContractQuery.Owner;
        getAttestAddress: ContractQuery.GetAttestAddress;
        getBrickProfileAddress: ContractQuery.GetBrickProfileAddress;
        getClient: ContractQuery.GetClient;
        getHandler: ContractQuery.GetHandler;
        getHandlerSettings: ContractQuery.GetHandlerSettings;
        answerRequest: ContractQuery.AnswerRequest;
        getAnswer: ContractQuery.GetAnswer;
        getRawAnswer: ContractQuery.GetRawAnswer;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface SetBrickProfileAddress extends DPT.ContractTx {
            (options: ContractOptions, brick_profile: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }

        export interface ConfigHandler extends DPT.ContractTx {
            (options: ContractOptions, handler_js: string, settings: Option$7): DPT.SubmittableExtrinsic;
        }

        export interface ConfigHandlerSettings extends DPT.ContractTx {
            (options: ContractOptions, settings: Option$7): DPT.SubmittableExtrinsic;
        }

        export interface ConfigClient extends DPT.ContractTx {
            (options: ContractOptions, rpc: string, client_addr: number[] | string): DPT.SubmittableExtrinsic;
        }

        export interface TransferOwnership extends DPT.ContractTx {
            (options: ContractOptions, new_owner: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
        setBrickProfileAddress: ContractTx.SetBrickProfileAddress;
        configHandler: ContractTx.ConfigHandler;
        configHandlerSettings: ContractTx.ConfigHandlerSettings;
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
        instantiate<T = Contract>(constructor: "new", params: [InkPrimitives_Types_AccountId$1], options?: DevPhase.InstantiateOptions): Promise<T>;
    }
}
