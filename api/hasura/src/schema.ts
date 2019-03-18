/* tslint:disable */


/**
 * AUTO-GENERATED FILE @ 2019-03-18 18:11:38 - DO NOT EDIT!
 *
 * This file was automatically generated by schemats v.3.0.3
 * $ schemats generate -c postgres://username:password@postgres:5432/postgres -t account -t session -s public
 *
 */


export namespace accountFields {
    export type account_id = string;
    export type created_at = Date;
    export type updated_at = Date;
    export type email = string;

}

export interface account {
    account_id: accountFields.account_id;
    created_at: accountFields.created_at;
    updated_at: accountFields.updated_at;
    email: accountFields.email;

}

export namespace sessionFields {
    export type session_id = string;
    export type last_accessed_at = Date;
    export type expires_at = Date;
    export type account_id = string;
    export type user_agent = string;

}

export interface session {
    session_id: sessionFields.session_id;
    last_accessed_at: sessionFields.last_accessed_at;
    expires_at: sessionFields.expires_at;
    account_id: sessionFields.account_id;
    user_agent: sessionFields.user_agent;

}
