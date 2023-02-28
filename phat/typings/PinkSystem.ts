import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "devphase";
import type * as DPT from "devphase/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace PinkSystem {
    type InkEnv_Types_AccountId = any;
    type InkPrimitives_Key = any;
    type InkStorage_Lazy_Mapping_Mapping = { offset_key: InkPrimitives_Key };
    type PinkExtension_System_Error = { PermisionDenied: null } | { DriverNotFound: null };
    type Result = { Ok: never[] } | { Err: PinkExtension_System_DriverError };
    type Option = { None: null } | { Some: InkEnv_Types_AccountId };
    type PinkExtension_HookPoint = { OnBlockEnd: null };
    type PinkExtension_System_DriverError = { Other: string } | { SystemError: PinkExtension_System_Error } | { BadOrigin: null };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface System_Version extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.ITuple<[ DPT.INumber, DPT.INumber ]>>>;
        }

        export interface System_GetDriver extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, name: string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Option>>>;
        }

        export interface System_DeploySidevmTo extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, contract_id: InkEnv_Types_AccountId, code_hash: DPT.FixedArray<number, 32>): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface System_StopSidevmAt extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, contract_id: InkEnv_Types_AccountId): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface System_SetContractWeight extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, contract_id: InkEnv_Types_AccountId, weight: number): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface System_TotalBalanceOf extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, account: InkEnv_Types_AccountId): DPT.CallResult<DPT.CallOutcome<DPT.INumber>>;
        }

        export interface System_FreeBalanceOf extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, account: InkEnv_Types_AccountId): DPT.CallResult<DPT.CallOutcome<DPT.INumber>>;
        }

        export interface System_IsAdmin extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, contract_id: InkEnv_Types_AccountId): DPT.CallResult<DPT.CallOutcome<DPT.IJson<boolean>>>;
        }

        export interface System_UpgradeSystemContract extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
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
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface System_GrantAdmin extends DPT.ContractTx {
            (options: ContractOptions, contract_id: InkEnv_Types_AccountId): DPT.SubmittableExtrinsic;
        }

        export interface System_SetDriver extends DPT.ContractTx {
            (options: ContractOptions, name: string, contract_id: InkEnv_Types_AccountId): DPT.SubmittableExtrinsic;
        }

        export interface System_SetHook extends DPT.ContractTx {
            (options: ContractOptions, hook: PinkExtension_HookPoint, contract: InkEnv_Types_AccountId, selector: number, gas_limit: number): DPT.SubmittableExtrinsic;
        }

        export interface ContractDeposit_ChangeDeposit extends DPT.ContractTx {
            (options: ContractOptions, contract_id: InkEnv_Types_AccountId, deposit: number): DPT.SubmittableExtrinsic;
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
