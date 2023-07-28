import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace Qjs {
    type InkPrimitives_LangError$3 = {
        CouldNotReadInput? : null
        };
    type Result$1 = {
        Ok? : never[],
        Err? : InkPrimitives_LangError$3
        };
    type Qjs_Qjs_Output$6 = {
        String? : string,
        Bytes? : number[] | string,
        Undefined? : null
        };
    type Result$5 = {
        Ok? : Qjs_Qjs_Output$6,
        Err? : string
        };
    type Result$4 = {
        Ok? : Result$5,
        Err? : InkPrimitives_LangError$3
        };
    type InkPrimitives_Types_AccountId$7 = any;
    type InkPrimitives_Types_Hash$8 = any;
    type InkEnv_Types_NoChainExtension$9 = {

        };
    type InkPrimitives_Types_AccountId$7 = any;
    type InkPrimitives_Types_Hash$8 = any;
    type InkEnv_Types_NoChainExtension$9 = {

        };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Eval extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, js: string, args: string[]): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$4>>>;
        }

        export interface EvalBytecode extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, bytecode: number[] | string, args: string[]): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$4>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        eval: ContractQuery.Eval;
        evalBytecode: ContractQuery.EvalBytecode;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
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
