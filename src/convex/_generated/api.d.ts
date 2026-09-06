/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as backendActions from "../backendActions.js";
import type * as backendRegistry from "../backendRegistry.js";
import type * as broadcasts from "../broadcasts.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as flowEngine from "../flowEngine.js";
import type * as flowEngine_queries from "../flowEngine_queries.js";
import type * as flows from "../flows.js";
import type * as http from "../http.js";
import type * as instagram from "../instagram.js";
import type * as integrations from "../integrations.js";
import type * as media from "../media.js";
import type * as licenses from "../licenses.js";
import type * as oauth from "../oauth.js";
import type * as products from "../products.js";
import type * as sequences from "../sequences.js";
import type * as tokenRefresh from "../tokenRefresh.js";
import type * as users from "../users.js";
import type * as webhooks from "../webhooks.js";
import type * as webhooks_mutations from "../webhooks_mutations.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  backendActions: typeof backendActions;
  backendRegistry: typeof backendRegistry;
  broadcasts: typeof broadcasts;
  contacts: typeof contacts;
  crons: typeof crons;
  flowEngine: typeof flowEngine;
  flowEngine_queries: typeof flowEngine_queries;
  flows: typeof flows;
  http: typeof http;
  instagram: typeof instagram;
  integrations: typeof integrations;
  licenses: typeof licenses;
  media: typeof media;
  oauth: typeof oauth;
  products: typeof products;
  sequences: typeof sequences;
  tokenRefresh: typeof tokenRefresh;
  users: typeof users;
  webhooks: typeof webhooks;
  webhooks_mutations: typeof webhooks_mutations;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
