import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace System {
    type InkPrimitives_Types_AccountId$1 = any;
    type InkPrimitives_LangError$4 = {
        CouldNotReadInput? : null
        };
    type Result$3 = {
        Ok? : never[],
        Err? : InkPrimitives_LangError$4
        };
    type Result$5 = {
        Ok? : [ number, number ],
        Err? : InkPrimitives_LangError$4
        };
    type PinkExtension_System_Error$9 = {
        PermisionDenied? : null,
        DriverNotFound? : null,
        CodeNotFound? : null,
        ConditionNotMet? : null
        };
    type Result$8 = {
        Ok? : never[],
        Err? : PinkExtension_System_Error$9
        };
    type Result$7 = {
        Ok? : Result$8,
        Err? : InkPrimitives_LangError$4
        };
    type Option$11 = {
        None? : null,
        Some? : InkPrimitives_Types_AccountId$1
        };
    type Result$10 = {
        Ok? : Option$11,
        Err? : InkPrimitives_LangError$4
        };
    type PinkExtension_HookPoint$12 = {
        OnBlockEnd? : null
        };
    type Result$13 = {
        Ok? : number,
        Err? : InkPrimitives_LangError$4
        };
    type Result$14 = {
        Ok? : boolean,
        Err? : InkPrimitives_LangError$4
        };
    type PinkExtension_System_CodeType$16 = {
        Ink? : null,
        Sidevm? : null
        };
    type PinkExtension_System_DriverError$19 = {
        Other? : string,
        SystemError? : PinkExtension_System_Error$9,
        BadOrigin? : null
        };
    type Result$18 = {
        Ok? : never[],
        Err? : PinkExtension_System_DriverError$19
        };
    type Result$17 = {
        Ok? : Result$18,
        Err? : InkPrimitives_LangError$4
        };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface System_Version extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$5>>>;
        }

        export interface System_GetDriver extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, name: string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$10>>>;
        }

        export interface System_DeploySidevmTo extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, contract_id: InkPrimitives_Types_AccountId$1, code_hash: DPT.FixedArray<number, 32>): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$7>>>;
        }

        export interface System_StopSidevmAt extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, contract_id: InkPrimitives_Types_AccountId$1): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$7>>>;
        }

        export interface System_SetContractWeight extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, contract_id: InkPrimitives_Types_AccountId$1, weight: number): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$7>>>;
        }

        export interface System_TotalBalanceOf extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, account: InkPrimitives_Types_AccountId$1): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$13>>>;
        }

        export interface System_FreeBalanceOf extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, account: InkPrimitives_Types_AccountId$1): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$13>>>;
        }

        export interface System_IsAdmin extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, contract_id: InkPrimitives_Types_AccountId$1): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$14>>>;
        }

        export interface System_UpgradeSystemContract extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$7>>>;
        }

        export interface System_DoUpgrade extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, from_version: [ number, number ]): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$7>>>;
        }

        export interface System_UpgradeRuntime extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, version: [ number, number ]): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$7>>>;
        }

        export interface System_CodeExists extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, code_hash: DPT.FixedArray<number, 32>, code_type: PinkExtension_System_CodeType$16): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$14>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        'system::version': ContractQuery.System_Version;
        'system::getDriver': ContractQuery.System_GetDriver;
        'system::deploySidevmTo': ContractQuery.System_DeploySidevmTo;
        'system::stopSidevmAt': ContractQuery.System_StopSidevmAt;
        'system::setContractWeight': ContractQuery.System_SetContractWeight;
        'system::totalBalanceOf': ContractQuery.System_TotalBalanceOf;
        'system::freeBalanceOf': ContractQuery.System_FreeBalanceOf;
        'system::isAdmin': ContractQuery.System_IsAdmin;
        'system::upgradeSystemContract': ContractQuery.System_UpgradeSystemContract;
        'system::doUpgrade': ContractQuery.System_DoUpgrade;
        'system::upgradeRuntime': ContractQuery.System_UpgradeRuntime;
        'system::codeExists': ContractQuery.System_CodeExists;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface System_GrantAdmin extends DPT.ContractTx {
            (options: ContractOptions, contract_id: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }

        export interface System_SetDriver extends DPT.ContractTx {
            (options: ContractOptions, name: string, contract_id: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }

        export interface System_SetHook extends DPT.ContractTx {
            (options: ContractOptions, hook: PinkExtension_HookPoint$12, contract: InkPrimitives_Types_AccountId$1, selector: number, gas_limit: number): DPT.SubmittableExtrinsic;
        }

        export interface ContractDeposit_ChangeDeposit extends DPT.ContractTx {
            (options: ContractOptions, contract_id: InkPrimitives_Types_AccountId$1, deposit: number): DPT.SubmittableExtrinsic;
        }
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
        'system::grantAdmin': ContractTx.System_GrantAdmin;
        'system::setDriver': ContractTx.System_SetDriver;
        'system::setHook': ContractTx.System_SetHook;
        'contractDeposit::changeDeposit': ContractTx.ContractDeposit_ChangeDeposit;
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
