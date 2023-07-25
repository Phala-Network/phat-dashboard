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

export namespace ActionEvmTransaction {
    export interface Error {
        badOrigin?: null;
        notConfigured?: null;
        badAbi?: null;
        badParams?: string;
        badToAddress?: null;
        badTransaction?: null;
        failedToSendTransaction?: null;
    }

    export namespace Error$ {
        export enum Enum {
            BadOrigin = "BadOrigin",
            NotConfigured = "NotConfigured",
            BadAbi = "BadAbi",
            BadParams = "BadParams",
            BadToAddress = "BadToAddress",
            BadTransaction = "BadTransaction",
            FailedToSendTransaction = "FailedToSendTransaction"
        }

        export type Human = ActionEvmTransaction.Error$.Enum.BadOrigin
            | ActionEvmTransaction.Error$.Enum.NotConfigured
            | ActionEvmTransaction.Error$.Enum.BadAbi
            | ActionEvmTransaction.Error$.Enum.BadToAddress
            | ActionEvmTransaction.Error$.Enum.BadTransaction
            | ActionEvmTransaction.Error$.Enum.FailedToSendTransaction
            | {
                BadParams?: string
            };
        export type Codec = DPT.Enum<ActionEvmTransaction.Error$.Enum.BadOrigin, never, never, PTT.Codec>
            | DPT.Enum<ActionEvmTransaction.Error$.Enum.NotConfigured, never, never, PTT.Codec>
            | DPT.Enum<ActionEvmTransaction.Error$.Enum.BadAbi, never, never, PTT.Codec>
            | DPT.Enum<ActionEvmTransaction.Error$.Enum.BadParams, string, string, PT.Text>
            | DPT.Enum<ActionEvmTransaction.Error$.Enum.BadToAddress, never, never, PTT.Codec>
            | DPT.Enum<ActionEvmTransaction.Error$.Enum.BadTransaction, never, never, PTT.Codec>
            | DPT.Enum<ActionEvmTransaction.Error$.Enum.FailedToSendTransaction, never, never, PTT.Codec>;
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

export namespace ActionEvmTransaction {
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

        export interface GetRpc extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PT.Text,
                        ActionEvmTransaction.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface BuildTransaction extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                to: string | PT.Text,
                abi: number[] | string | PT.Vec<PT.U8>,
                func: string | PT.Text,
                params: number[] | string[] | PT.Vec<PT.Vec<PT.U8>>,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PT.Vec<PT.U8>,
                        ActionEvmTransaction.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface MaybeSendTransaction extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                rlp: number[] | string | PT.Vec<PT.U8>,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PTI.H256,
                        ActionEvmTransaction.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }
    }

    interface MapMessageQuery extends DPT.MapMessageQuery {
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

    interface MapMessageTx extends DPT.MapMessageTx {
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
    export declare class Factory extends DevPhase.ContractFactory<Contract> {
        instantiate(constructor: "default", params: never[], options?: DevPhase.InstantiateOptions): Promise<Contract>;
    }
}
