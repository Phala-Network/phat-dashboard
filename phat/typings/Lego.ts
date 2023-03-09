import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "devphase";
import type * as DPT from "devphase/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace Lego {
    type InkPrimitives_LangError = { CouldNotReadInput: null };
    type Result = { Ok: boolean } | { Err: InkPrimitives_LangError };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Run extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, actions: string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
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
