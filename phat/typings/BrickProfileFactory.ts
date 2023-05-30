import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace BrickProfileFactory {
    type InkPrimitives_Types_AccountId$1 = any;
    type InkPrimitives_Types_Hash$2 = any;
    type BTreeMap$3 = any;
    type BrickProfile_BrickProfile_CallBuilder$5 = { account_id: InkPrimitives_Types_AccountId$1 };
    type BrickProfile_BrickProfile_BrickProfileRef$4 = { inner: BrickProfile_BrickProfile_CallBuilder$5 };
    type InkPrimitives_LangError$9 = {
        CouldNotReadInput? : null
        };
    type Result$7 = {
        Ok? : never[],
        Err? : InkPrimitives_LangError$9
        };
    type Result$10 = {
        Ok? : [ number, number, number ],
        Err? : InkPrimitives_LangError$9
        };
    type Result$12 = {
        Ok? : InkPrimitives_Types_AccountId$1,
        Err? : InkPrimitives_LangError$9
        };
    type Result$13 = {
        Ok? : number,
        Err? : InkPrimitives_LangError$9
        };
    type Result$14 = {
        Ok? : InkPrimitives_Types_Hash$2,
        Err? : InkPrimitives_LangError$9
        };
    type BrickProfileFactory_BrickProfileFactory_Error$17 = {
        BadOrigin? : null,
        NoDuplicatedUserProfile? : null,
        FailedToCreateProfile? : string,
        UserProfileNotExists? : null
        };
    type Result$16 = {
        Ok? : never[],
        Err? : BrickProfileFactory_BrickProfileFactory_Error$17
        };
    type Result$15 = {
        Ok? : Result$16,
        Err? : InkPrimitives_LangError$9
        };
    type Result$19 = {
        Ok? : InkPrimitives_Types_AccountId$1,
        Err? : BrickProfileFactory_BrickProfileFactory_Error$17
        };
    type Result$18 = {
        Ok? : Result$19,
        Err? : InkPrimitives_LangError$9
        };
    type Result$21 = {
        Ok? : [ InkPrimitives_Types_AccountId$1, InkPrimitives_Types_AccountId$1 ][],
        Err? : BrickProfileFactory_BrickProfileFactory_Error$17
        };
    type Result$20 = {
        Ok? : Result$21,
        Err? : InkPrimitives_LangError$9
        };
    type PinkExtension_ChainExtension_PinkExt$23 = {

        };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface Version extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$10>>>;
        }

        export interface Owner extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$12>>>;
        }

        export interface UserCount extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$13>>>;
        }

        export interface ProfileCodeHash extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$14>>>;
        }

        export interface GetUserProfileAddress extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$18>>>;
        }

        export interface GetUserProfiles extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$20>>>;
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
            (options: ContractOptions, profile_code_hash: InkPrimitives_Types_Hash$2): DPT.SubmittableExtrinsic;
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
        instantiate<T = Contract>(constructor: "new", params: [InkPrimitives_Types_Hash$2], options?: DevPhase.InstantiateOptions): Promise<T>;
    }
}
