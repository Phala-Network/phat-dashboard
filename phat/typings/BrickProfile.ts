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

export namespace BrickProfile {
    export interface Error {
        badOrigin?: null;
        notConfigured?: null;
        deprecated?: null;
        noPollForTransaction?: null;
        badWorkflowSession?: null;
        badEvmSecretKey?: null;
        badUnsignedTransaction?: null;
        workflowNotFound?: null;
        workflowDisabled?: null;
        noAuthorizedExternalAccount?: null;
        externalAccountNotFound?: null;
        externalAccountDisabled?: null;
        failedToGetEthAccounts?: string;
        failedToSignTransaction?: string;
        onlyDumpedAccount?: null;
    }

    export interface Workflow {
        id: number;
        name: string;
        enabled: boolean;
        commandline: string;
    }

    export namespace Error$ {
        export enum Enum {
            BadOrigin = "BadOrigin",
            NotConfigured = "NotConfigured",
            Deprecated = "Deprecated",
            NoPollForTransaction = "NoPollForTransaction",
            BadWorkflowSession = "BadWorkflowSession",
            BadEvmSecretKey = "BadEvmSecretKey",
            BadUnsignedTransaction = "BadUnsignedTransaction",
            WorkflowNotFound = "WorkflowNotFound",
            WorkflowDisabled = "WorkflowDisabled",
            NoAuthorizedExternalAccount = "NoAuthorizedExternalAccount",
            ExternalAccountNotFound = "ExternalAccountNotFound",
            ExternalAccountDisabled = "ExternalAccountDisabled",
            FailedToGetEthAccounts = "FailedToGetEthAccounts",
            FailedToSignTransaction = "FailedToSignTransaction",
            OnlyDumpedAccount = "OnlyDumpedAccount"
        }

        export type Human = BrickProfile.Error$.Enum.BadOrigin
            | BrickProfile.Error$.Enum.NotConfigured
            | BrickProfile.Error$.Enum.Deprecated
            | BrickProfile.Error$.Enum.NoPollForTransaction
            | BrickProfile.Error$.Enum.BadWorkflowSession
            | BrickProfile.Error$.Enum.BadEvmSecretKey
            | BrickProfile.Error$.Enum.BadUnsignedTransaction
            | BrickProfile.Error$.Enum.WorkflowNotFound
            | BrickProfile.Error$.Enum.WorkflowDisabled
            | BrickProfile.Error$.Enum.NoAuthorizedExternalAccount
            | BrickProfile.Error$.Enum.ExternalAccountNotFound
            | BrickProfile.Error$.Enum.ExternalAccountDisabled
            | BrickProfile.Error$.Enum.OnlyDumpedAccount
            | {
                FailedToGetEthAccounts?: string, FailedToSignTransaction?: string
            };
        export type Codec = DPT.Enum<BrickProfile.Error$.Enum.BadOrigin, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.NotConfigured, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.Deprecated, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.NoPollForTransaction, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.BadWorkflowSession, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.BadEvmSecretKey, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.BadUnsignedTransaction, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.WorkflowNotFound, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.WorkflowDisabled, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.NoAuthorizedExternalAccount, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.ExternalAccountNotFound, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.ExternalAccountDisabled, never, never, PTT.Codec>
            | DPT.Enum<BrickProfile.Error$.Enum.FailedToGetEthAccounts, string, string, PT.Text>
            | DPT.Enum<BrickProfile.Error$.Enum.FailedToSignTransaction, string, string, PT.Text>
            | DPT.Enum<BrickProfile.Error$.Enum.OnlyDumpedAccount, never, never, PTT.Codec>;
    }

    export namespace Workflow$ {
        export interface Human {
            id: number;
            name: string;
            enabled: boolean;
            commandline: string;
        }

        export interface Codec extends DPT.Json<BrickProfile.Workflow, BrickProfile.Workflow$.Human> {
            id: PT.U64;
            name: PT.Text;
            enabled: PT.Bool;
            commandline: PT.Text;
        }
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

export namespace BrickProfile {
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

        export interface GetJsRunner extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PTI.AccountId,
                        BrickProfile.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface WorkflowCount extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    PT.U64,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetWorkflow extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                id: number | PT.U64,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        BrickProfile.Workflow$.Codec,
                        BrickProfile.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetEvmAccountAddress extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                id: number | PT.U64,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PTI.H160,
                        BrickProfile.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetRpcEndpoint extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                id: number | PT.U64,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PT.Text,
                        BrickProfile.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface ExternalAccountCount extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    PT.U64,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetDumpedKey extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                id: number | PT.U64,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PT.VecFixed<PT.U8>,
                        BrickProfile.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetAuthorizedAccount extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                workflow: number | PT.U64,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Option$.Codec<
                        PT.U64
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetCurrentEvmAccountAddress extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PTI.H160,
                        BrickProfile.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface SignEvmTransaction extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                tx: number[] | string | PT.Vec<PT.U8>,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PT.Vec<PT.U8>,
                        BrickProfile.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }
    }

    interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        owner: ContractQuery.Owner;
        getJsRunner: ContractQuery.GetJsRunner;
        workflowCount: ContractQuery.WorkflowCount;
        getWorkflow: ContractQuery.GetWorkflow;
        getEvmAccountAddress: ContractQuery.GetEvmAccountAddress;
        getRpcEndpoint: ContractQuery.GetRpcEndpoint;
        externalAccountCount: ContractQuery.ExternalAccountCount;
        getDumpedKey: ContractQuery.GetDumpedKey;
        getAuthorizedAccount: ContractQuery.GetAuthorizedAccount;
        getCurrentEvmAccountAddress: ContractQuery.GetCurrentEvmAccountAddress;
        signEvmTransaction: ContractQuery.SignEvmTransaction;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface Config extends DPT.ContractTx {
            (options: ContractOptions, js_runner: string | number[]): DPT.SubmittableExtrinsic;
        }

        export interface AddWorkflow extends DPT.ContractTx {
            (options: ContractOptions, name: string, commandline: string): DPT.SubmittableExtrinsic;
        }

        export interface EnableWorkflow extends DPT.ContractTx {
            (options: ContractOptions, id: number): DPT.SubmittableExtrinsic;
        }

        export interface DisableWorkflow extends DPT.ContractTx {
            (options: ContractOptions, id: number): DPT.SubmittableExtrinsic;
        }

        export interface SetRpcEndpoint extends DPT.ContractTx {
            (options: ContractOptions, id: number, rpc: string): DPT.SubmittableExtrinsic;
        }

        export interface GenerateEvmAccount extends DPT.ContractTx {
            (options: ContractOptions, rpc: string): DPT.SubmittableExtrinsic;
        }

        export interface ImportEvmAccount extends DPT.ContractTx {
            (options: ContractOptions, rpc: string, sk: number[] | string): DPT.SubmittableExtrinsic;
        }

        export interface DumpEvmAccount extends DPT.ContractTx {
            (options: ContractOptions, id: number): DPT.SubmittableExtrinsic;
        }

        export interface AuthorizeWorkflow extends DPT.ContractTx {
            (options: ContractOptions, workflow: number, account: number): DPT.SubmittableExtrinsic;
        }

        export interface SetWorkflowSession extends DPT.ContractTx {
            (options: ContractOptions, workflow: number): DPT.SubmittableExtrinsic;
        }

        export interface Poll extends DPT.ContractTx {
            (options: ContractOptions, workflow_id: number): DPT.SubmittableExtrinsic;
        }
    }

    interface MapMessageTx extends DPT.MapMessageTx {
        config: ContractTx.Config;
        addWorkflow: ContractTx.AddWorkflow;
        enableWorkflow: ContractTx.EnableWorkflow;
        disableWorkflow: ContractTx.DisableWorkflow;
        setRpcEndpoint: ContractTx.SetRpcEndpoint;
        generateEvmAccount: ContractTx.GenerateEvmAccount;
        importEvmAccount: ContractTx.ImportEvmAccount;
        dumpEvmAccount: ContractTx.DumpEvmAccount;
        authorizeWorkflow: ContractTx.AuthorizeWorkflow;
        setWorkflowSession: ContractTx.SetWorkflowSession;
        poll: ContractTx.Poll;
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
        instantiate(constructor: "default", params: never[], options?: DevPhase.InstantiateOptions): Promise<Contract>;
    }
}
