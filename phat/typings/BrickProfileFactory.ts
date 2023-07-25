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

export namespace BrickProfile {
    export interface CallBuilder {
        accountId: string | number[];
    }

    export interface BrickProfileRef {
        inner: BrickProfile.CallBuilder;
    }

    export namespace CallBuilder$ {
        export interface Human {
            accountId: string;
        }

        export interface Codec extends DPT.Json<BrickProfile.CallBuilder, BrickProfile.CallBuilder$.Human> {
            accountId: PTI.AccountId;
        }
    }

    export namespace BrickProfileRef$ {
        export interface Human {
            inner: BrickProfile.CallBuilder$.Human;
        }

        export interface Codec extends DPT.Json<BrickProfile.BrickProfileRef, BrickProfile.BrickProfileRef$.Human> {
            inner: BrickProfile.CallBuilder$.Codec;
        }
    }
}

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

export namespace BrickProfileFactory {
    export interface Error {
        badOrigin?: null;
        noDuplicatedUserProfile?: null;
        failedToCreateProfile?: string;
        userProfileNotExists?: null;
    }

    export namespace Error$ {
        export enum Enum {
            BadOrigin = "BadOrigin",
            NoDuplicatedUserProfile = "NoDuplicatedUserProfile",
            FailedToCreateProfile = "FailedToCreateProfile",
            UserProfileNotExists = "UserProfileNotExists"
        }

        export type Human = BrickProfileFactory.Error$.Enum.BadOrigin
            | BrickProfileFactory.Error$.Enum.NoDuplicatedUserProfile
            | BrickProfileFactory.Error$.Enum.UserProfileNotExists
            | {
                FailedToCreateProfile?: string
            };
        export type Codec = DPT.Enum<BrickProfileFactory.Error$.Enum.BadOrigin, never, never, PTT.Codec>
            | DPT.Enum<BrickProfileFactory.Error$.Enum.NoDuplicatedUserProfile, never, never, PTT.Codec>
            | DPT.Enum<BrickProfileFactory.Error$.Enum.FailedToCreateProfile, string, string, PT.Text>
            | DPT.Enum<BrickProfileFactory.Error$.Enum.UserProfileNotExists, never, never, PTT.Codec>;
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

export namespace BrickProfileFactory {
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

        export interface UserCount extends DPT.ContractQuery {
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

        export interface ProfileCodeHash extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    PTI.Hash,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetUserProfileAddress extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PTI.AccountId,
                        BrickProfileFactory.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }

        export interface GetUserProfiles extends DPT.ContractQuery {
            (
                certificateData: PhalaSdk.CertificateData,
                options: ContractOptions,
            ): DPT.CallReturn<
                DPT.Result$.Codec<
                    DPT.Result$.Codec<
                        PT.Vec<PTT.ITuple<[PTI.AccountId, PTI.AccountId]>>,
                        BrickProfileFactory.Error$.Codec
                    >,
                    InkPrimitives.LangError$.Codec
                >
            >;
        }
    }

    interface MapMessageQuery extends DPT.MapMessageQuery {
        version: ContractQuery.Version;
        owner: ContractQuery.Owner;
        userCount: ContractQuery.UserCount;
        profileCodeHash: ContractQuery.ProfileCodeHash;
        getUserProfileAddress: ContractQuery.GetUserProfileAddress;
        getUserProfiles: ContractQuery.GetUserProfiles;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface SetProfileCodeHash extends DPT.ContractTx {
            (options: ContractOptions, profile_code_hash: string | number[]): DPT.SubmittableExtrinsic;
        }

        export interface CreateUserProfile extends DPT.ContractTx {
            (options: ContractOptions): DPT.SubmittableExtrinsic;
        }
    }

    interface MapMessageTx extends DPT.MapMessageTx {
        setProfileCodeHash: ContractTx.SetProfileCodeHash;
        createUserProfile: ContractTx.CreateUserProfile;
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
        instantiate(constructor: "new", params: [string | number[] | PTI.Hash], options?: DevPhase.InstantiateOptions): Promise<Contract>;
    }
}
