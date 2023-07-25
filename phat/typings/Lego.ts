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

export namespace InkEnv {
    export namespace Types {
        export type NoChainExtension = any;

        export namespace NoChainExtension$ {
            export type Enum = any;
            export type Human = any;
            export type Codec = any;
        }
    }
}

export namespace Lego {
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

        export interface Run extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
                actions: string | PT.Text,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    PT.Bool,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }
    }

    interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        run: ContractQuery.Run;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
    }

    interface MapMessageTx extends DPT.MapMessageTx {
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
