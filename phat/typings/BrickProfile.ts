import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace BrickProfile {
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
    type BrickProfile_BrickProfile_Error$10 = {
        BadOrigin? : null,
        NotConfigured? : null,
        Deprecated? : null,
        NoPollForTransaction? : null,
        BadWorkflowSession? : null,
        BadEvmSecretKey? : null,
        BadUnsignedTransaction? : null,
        WorkflowNotFound? : null,
        WorkflowDisabled? : null,
        NoAuthorizedExternalAccount? : null,
        ExternalAccountNotFound? : null,
        ExternalAccountDisabled? : null,
        FailedToGetEthAccounts? : string,
        FailedToSignTransaction? : string
        };
    type Result$9 = {
        Ok? : InkPrimitives_Types_AccountId$1,
        Err? : BrickProfile_BrickProfile_Error$10
        };
    type Result$8 = {
        Ok? : Result$9,
        Err? : InkPrimitives_LangError$4
        };
    type Result$12 = {
        Ok? : never[],
        Err? : BrickProfile_BrickProfile_Error$10
        };
    type Result$11 = {
        Ok? : Result$12,
        Err? : InkPrimitives_LangError$4
        };
    type Result$13 = {
        Ok? : number,
        Err? : InkPrimitives_LangError$4
        };
    type Result$15 = {
        Ok? : number,
        Err? : BrickProfile_BrickProfile_Error$10
        };
    type Result$14 = {
        Ok? : Result$15,
        Err? : InkPrimitives_LangError$4
        };
    type BrickProfile_BrickProfile_Workflow$18 = { id: number, name: string, enabled: boolean, commandline: string };
    type Result$17 = {
        Ok? : BrickProfile_BrickProfile_Workflow$18,
        Err? : BrickProfile_BrickProfile_Error$10
        };
    type Result$16 = {
        Ok? : Result$17,
        Err? : InkPrimitives_LangError$4
        };
    type PrimitiveTypes_H160$21 = any;
    type Result$20 = {
        Ok? : PrimitiveTypes_H160$21,
        Err? : BrickProfile_BrickProfile_Error$10
        };
    type Result$19 = {
        Ok? : Result$20,
        Err? : InkPrimitives_LangError$4
        };
    type Option$23 = {
        None? : null,
        Some? : number
        };
    type Result$22 = {
        Ok? : Option$23,
        Err? : InkPrimitives_LangError$4
        };
    type Result$25 = {
        Ok? : number[] | string,
        Err? : BrickProfile_BrickProfile_Error$10
        };
    type Result$24 = {
        Ok? : Result$25,
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

        export interface GetJsRunner extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$8>>>;
        }

        export interface WorkflowCount extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$13>>>;
        }

        export interface GetWorkflow extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, id: number): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$16>>>;
        }

        export interface GetEvmAccountAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, id: number): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$19>>>;
        }

        export interface ExternalAccountCount extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$13>>>;
        }

        export interface GetAuthorizedAccount extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, workflow: number): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$22>>>;
        }

        export interface GetCurrentEvmAccountAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$19>>>;
        }

        export interface SignEvmTransaction extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, tx: number[] | string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$24>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        owner: ContractQuery.Owner;
        getJsRunner: ContractQuery.GetJsRunner;
        workflowCount: ContractQuery.WorkflowCount;
        getWorkflow: ContractQuery.GetWorkflow;
        getEvmAccountAddress: ContractQuery.GetEvmAccountAddress;
        externalAccountCount: ContractQuery.ExternalAccountCount;
        getAuthorizedAccount: ContractQuery.GetAuthorizedAccount;
        getCurrentEvmAccountAddress: ContractQuery.GetCurrentEvmAccountAddress;
        signEvmTransaction: ContractQuery.SignEvmTransaction;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface Config extends DPT.ContractTx {
            (options: ContractOptions, js_runner: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
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
            (options: ContractOptions): DPT.SubmittableExtrinsic;
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
    export declare class Factory extends DevPhase.ContractFactory {
        instantiate<T = Contract>(constructor: "new", params: [InkPrimitives_Types_AccountId$1], options?: DevPhase.InstantiateOptions): Promise<T>;
        instantiate<T = Contract>(constructor: "default", params: never[], options?: DevPhase.InstantiateOptions): Promise<T>;
    }
}
