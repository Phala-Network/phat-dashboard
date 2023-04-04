import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "devphase";
import type * as DPT from "devphase/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace SimpleCloudWallet {
    type InkPrimitives_Types_AccountId = any;
    type InkPrimitives_LangError = { CouldNotReadInput: null };
    type Result = { Ok: Result } | { Err: InkPrimitives_LangError };
    type SimpleCloudWallet_SimpleCloudWallet_Error = { BadOrigin: null } | { NotConfigured: null } | { Deprecated: null } | { NoPollForTransaction: null } | { BadWorkflowSession: null } | { BadEvmSecretKey: null } | { BadUnsignedTransaction: null } | { WorkflowNotFound: null } | { WorkflowDisabled: null } | { NoAuthorizedExternalAccount: null } | { ExternalAccountNotFound: null } | { ExternalAccountDisabled: null } | { FailedToGetEthAccounts: string } | { FailedToSignTransaction: string };
    type SimpleCloudWallet_SimpleCloudWallet_Workflow = { id: number, name: string, enabled: boolean, commandline: string };
    type PrimitiveTypes_H160 = any;
    type Option = { None: null } | { Some: number };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Owner extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface GetJsRunner extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface WorkflowCount extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface GetWorkflow extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, id: number): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface GetEvmAccountAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, id: number): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface ExternalAccountCount extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface GetAuthorizedAccount extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, workflow: number): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface GetCurrentEvmAccountAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface SignEvmTransaction extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, tx: number[]): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface Poll extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        owner: ContractQuery.Owner;
        getJsRunner: ContractQuery.GetJsRunner;
        workflowCount: ContractQuery.WorkflowCount;
        getWorkflow: ContractQuery.GetWorkflow;
        getEvmAccountAddress: ContractQuery.GetEvmAccountAddress;
        externalAccountCount: ContractQuery.ExternalAccountCount;
        getAuthorizedAccount: ContractQuery.GetAuthorizedAccount;
        getCurrentEvmAccountAddress: ContractQuery.GetCurrentEvmAccountAddress;
        signEvmTransaction: ContractQuery.SignEvmTransaction;
        poll: ContractQuery.Poll;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface Config extends DPT.ContractTx {
            (options: ContractOptions, js_runner: InkPrimitives_Types_AccountId): DPT.SubmittableExtrinsic;
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

        export interface GenerateEvmAccount extends DPT.ContractTx {
            (options: ContractOptions, rpc: string): DPT.SubmittableExtrinsic;
        }

        export interface ImportEvmAccount extends DPT.ContractTx {
            (options: ContractOptions, rpc: string, sk: number[]): DPT.SubmittableExtrinsic;
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
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
        config: ContractTx.Config;
        addWorkflow: ContractTx.AddWorkflow;
        enableWorkflow: ContractTx.EnableWorkflow;
        disableWorkflow: ContractTx.DisableWorkflow;
        generateEvmAccount: ContractTx.GenerateEvmAccount;
        importEvmAccount: ContractTx.ImportEvmAccount;
        dumpEvmAccount: ContractTx.DumpEvmAccount;
        authorizeWorkflow: ContractTx.AuthorizeWorkflow;
        setWorkflowSession: ContractTx.SetWorkflowSession;
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
