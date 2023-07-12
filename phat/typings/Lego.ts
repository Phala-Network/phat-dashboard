import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace Lego {
    type InkPrimitives_LangError$3 = {
        CouldNotReadInput? : null
        };
    type Result$1 = {
        Ok? : never[],
        Err? : InkPrimitives_LangError$3
        };
    type Result$4 = {
        Ok? : [ number, number, number ],
        Err? : InkPrimitives_LangError$3
        };
    type Result$6 = {
        Ok? : boolean,
        Err? : InkPrimitives_LangError$3
        };
    type InkPrimitives_Types_AccountId$7 = any;
    type InkPrimitives_Types_Hash$8 = any;
    type InkEnv_Types_NoChainExtension$9 = {

        };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Version extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$4>>>;
        }

        export interface Run extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, actions: string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$6>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        run: ContractQuery.Run;
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
