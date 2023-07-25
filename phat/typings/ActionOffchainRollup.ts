import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type * as DPT from "@devphase/service/etc/typings";
import type * as PT from "@polkadot/types";
import type * as PTI from "@polkadot/types/interfaces";
import type * as PTT from "@polkadot/types/types";


/** */
/** Exported types */
/** */

export namespace ActionOffchainRollup {
    export interface Core {
        script: string;
        settings: string;
        codeHash: number[];
    }

    export interface Client {
        rpc: string;
        clientAddr: number[];
    }

    export interface ActionOffchainRollup {
        owner: string | number[];
        attestKey: number[];
        brickProfile: string | number[];
        client: DPT.Option<
            ActionOffchainRollup.Client
        >;
        core: DPT.InkStorage.Lazy.Lazy<
            ActionOffchainRollup.Core,
            any
        >;
    }

    export interface Error {
        badOrigin?: null;
        clientNotConfigured?: null;
        coreNotConfigured?: null;
        badBrickProfile?: null;
        invalidAddressLength?: null;
        noRequestInQueue?: null;
        failedToCreateClient?: null;
        failedToCommitTx?: null;
        failedToGetStorage?: null;
        failedToCreateTransaction?: null;
        failedToSignTransaction?: null;
        failedToSendTransaction?: null;
        invalidJsOutput?: null;
        jsError?: string;
    }

    export namespace Core$ {
        export interface Human {
            script: string;
            settings: string;
            codeHash: number[];
        }

        export interface Codec extends DPT.Json<ActionOffchainRollup.Core, ActionOffchainRollup.Core$.Human> {
            script: PT.Text;
            settings: PT.Text;
            codeHash: PT.VecFixed<PT.U8>;
        }
    }

    export namespace Client$ {
        export interface Human {
            rpc: string;
            clientAddr: number[];
        }

        export interface Codec extends DPT.Json<ActionOffchainRollup.Client, ActionOffchainRollup.Client$.Human> {
            rpc: PT.Text;
            clientAddr: PT.VecFixed<PT.U8>;
        }
    }

    export namespace ActionOffchainRollup$ {
        export interface Human {
            owner: string;
            attestKey: number[];
            brickProfile: string;
            client: DPT.Option$.Human<
                ActionOffchainRollup.Client$.Human
            >;
            core: DPT.InkStorage.Lazy.Lazy<
                ActionOffchainRollup.Core$.Human,
                any
            >;
        }

        export interface Codec extends DPT.Json<ActionOffchainRollup.ActionOffchainRollup, ActionOffchainRollup.ActionOffchainRollup$.Human> {
            owner: PTI.AccountId;
            attestKey: PT.VecFixed<PT.U8>;
            brickProfile: PTI.AccountId;
            client: DPT.Option$.Codec<
                ActionOffchainRollup.Client$.Codec
            >;
            core: DPT.InkStorage.Lazy.Lazy<
                ActionOffchainRollup.Core$.Codec,
                any
            >;
        }
    }

    export namespace Error$ {
        export enum Enum {
            BadOrigin = "BadOrigin",
            ClientNotConfigured = "ClientNotConfigured",
            CoreNotConfigured = "CoreNotConfigured",
            BadBrickProfile = "BadBrickProfile",
            InvalidAddressLength = "InvalidAddressLength",
            NoRequestInQueue = "NoRequestInQueue",
            FailedToCreateClient = "FailedToCreateClient",
            FailedToCommitTx = "FailedToCommitTx",
            FailedToGetStorage = "FailedToGetStorage",
            FailedToCreateTransaction = "FailedToCreateTransaction",
            FailedToSignTransaction = "FailedToSignTransaction",
            FailedToSendTransaction = "FailedToSendTransaction",
            InvalidJsOutput = "InvalidJsOutput",
            JsError = "JsError"
        }

        export type Human = ActionOffchainRollup.Error$.Enum.BadOrigin
            | ActionOffchainRollup.Error$.Enum.ClientNotConfigured
            | ActionOffchainRollup.Error$.Enum.CoreNotConfigured
            | ActionOffchainRollup.Error$.Enum.BadBrickProfile
            | ActionOffchainRollup.Error$.Enum.InvalidAddressLength
            | ActionOffchainRollup.Error$.Enum.NoRequestInQueue
            | ActionOffchainRollup.Error$.Enum.FailedToCreateClient
            | ActionOffchainRollup.Error$.Enum.FailedToCommitTx
            | ActionOffchainRollup.Error$.Enum.FailedToGetStorage
            | ActionOffchainRollup.Error$.Enum.FailedToCreateTransaction
            | ActionOffchainRollup.Error$.Enum.FailedToSignTransaction
            | ActionOffchainRollup.Error$.Enum.FailedToSendTransaction
            | ActionOffchainRollup.Error$.Enum.InvalidJsOutput
            | {
                JsError?: string
            };
        export type Codec = DPT.Enum<ActionOffchainRollup.Error$.Enum.BadOrigin, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.ClientNotConfigured, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.CoreNotConfigured, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.BadBrickProfile, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.InvalidAddressLength, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.NoRequestInQueue, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.FailedToCreateClient, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.FailedToCommitTx, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.FailedToGetStorage, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.FailedToCreateTransaction, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.FailedToSignTransaction, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.FailedToSendTransaction, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.InvalidJsOutput, never, never, PTT.Codec>
            | DPT.Enum<ActionOffchainRollup.Error$.Enum.JsError, string, string, PT.Text>;
    }
}

export namespace InkPrimitives {
    export interface LangError {
        couldNotReadInput?: null;
    }

    export namespace LangError$ {
        export enum Enum {
            CouldNotReadInput = "CouldNotReadInput"
        }

        export type Human = InkPrimitives.LangError$.Enum.CouldNotReadInput;
        export type Codec = DPT.Enum<InkPrimitives.LangError$.Enum.CouldNotReadInput, never, never, PTT.Codec>;
    }
}

export namespace PinkExtension {
    export namespace ChainExtension {
        export type PinkExt = any;

        export namespace PinkExt$ {
            export type Enum = any;
            export type Human = any;
            export type Codec = any;
        }
    }
}

export namespace ActionOffchainRollup {
    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Version extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    PTT.ITuple<[PT.U16, PT.U16, PT.U16]>,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface Owner extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    PTI.AccountId,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetAttestAddress extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    PTI.H160,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetBrickProfileAddress extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    PTI.AccountId,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetClient extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        ActionOffchainRollup.Client$.Codec,
                        ActionOffchainRollup.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetCore extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Option$.Codec<
                        ActionOffchainRollup.Core$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface AnswerRequest extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        DPT.Option$.Codec<
                            PT.Vec<PT.U8>
                        >,
                        ActionOffchainRollup.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetAnswer extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                request: number[] | string | PT.Vec<PT.U8>,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PT.Vec<PT.U8>,
                        ActionOffchainRollup.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetAnswerWithCodeHash extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                request: number[] | string | PT.Vec<PT.U8>,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PT.Vec<PT.U8>,
                        ActionOffchainRollup.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetRawAnswer extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                request: number[] | string | PT.Vec<PT.U8>,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PTT.ITuple<[PT.Vec<PT.U8>, PT.VecFixed<PT.U8>]>,
                        ActionOffchainRollup.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }
    }

    interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        owner: ContractQuery.Owner;
        getAttestAddress: ContractQuery.GetAttestAddress;
        getBrickProfileAddress: ContractQuery.GetBrickProfileAddress;
        getClient: ContractQuery.GetClient;
        getCore: ContractQuery.GetCore;
        answerRequest: ContractQuery.AnswerRequest;
        getAnswer: ContractQuery.GetAnswer;
        getAnswerWithCodeHash: ContractQuery.GetAnswerWithCodeHash;
        getRawAnswer: ContractQuery.GetRawAnswer;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface SetBrickProfileAddress extends DPT.ContractTx {
            (options: ContractOptions, brick_profile: string | number[]): DPT.SubmittableExtrinsic;
        }

        export interface ConfigCore extends DPT.ContractTx {
            (options: ContractOptions, core_js: string, settings: string): DPT.SubmittableExtrinsic;
        }

        export interface ConfigCoreSettings extends DPT.ContractTx {
            (options: ContractOptions, settings: string): DPT.SubmittableExtrinsic;
        }

        export interface ConfigClient extends DPT.ContractTx {
            (options: ContractOptions, rpc: string, client_addr: number[] | string): DPT.SubmittableExtrinsic;
        }

        export interface TransferOwnership extends DPT.ContractTx {
            (options: ContractOptions, new_owner: string | number[]): DPT.SubmittableExtrinsic;
        }
    }

    interface MapMessageTx extends DPT.MapMessageTx {
        setBrickProfileAddress: ContractTx.SetBrickProfileAddress;
        configCore: ContractTx.ConfigCore;
        configCoreSettings: ContractTx.ConfigCoreSettings;
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
    export declare class Factory extends DevPhase.ContractFactory<Contract> {
        instantiate(constructor: "new", params: [string | number[] | PTI.AccountId], options?: DevPhase.InstantiateOptions): Promise<Contract>;
        instantiate(constructor: "with_core", params: [string | PT.Text, string | PT.Text, string | number[] | PTI.AccountId], options?: DevPhase.InstantiateOptions): Promise<Contract>;
    }
}
