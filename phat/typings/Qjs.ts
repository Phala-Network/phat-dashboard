import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "devphase";
import type * as DPT from "devphase/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace Qjs {
    type Qjs_Qjs_Output = { String: string } | { Bytes: number[] } | { Undefined: null };
    type Result = { Ok: Qjs_Qjs_Output } | { Err: string };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Eval extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, js: string, args: string[]): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface EvalBytecode extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, bytecode: number[], args: string[]): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
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
