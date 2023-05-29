import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "devphase";
import type * as DPT from "devphase/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace BrickProfileFactory {
    type InkPrimitives_Types_AccountId = any;
    type InkPrimitives_Types_Hash = any;
    type BTreeMap = any;
    type BrickProfile_BrickProfile_CallBuilder = { account_id: InkPrimitives_Types_AccountId };
    type BrickProfile_BrickProfile_BrickProfileRef = { inner: BrickProfile_BrickProfile_CallBuilder };
    type InkPrimitives_LangError = { CouldNotReadInput: null };
    type Result = { Ok: Result } | { Err: InkPrimitives_LangError };
    type BrickProfileFactory_BrickProfileFactory_Error = { BadOrigin: null } | { NoDuplicatedUserProfile: null } | { FailedToCreateProfile: string } | { UserProfileNotExists: null };
    type PinkExtension_ChainExtension_PinkExt = {};

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Version extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface Owner extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface UserCount extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface ProfileCodeHash extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface GetUserProfileAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }

        export interface GetUserProfiles extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
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
            (options: ContractOptions, profile_code_hash: InkPrimitives_Types_Hash): DPT.SubmittableExtrinsic;
        }

        export interface CreateUserProfile extends DPT.ContractTx {
            (options: ContractOptions): DPT.SubmittableExtrinsic;
        }
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
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
    export declare class Factory extends DevPhase.ContractFactory {
        instantiate<T = Contract>(constructor: "new", params: [InkPrimitives_Types_Hash], options?: DevPhase.InstantiateOptions): Promise<T>;
        instantiate<T = Contract>(constructor: "default", params: never[], options?: DevPhase.InstantiateOptions): Promise<T>;
    }
}
