/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as cleanup from "../cleanup.js";
import type * as entries from "../entries.js";
import type * as http from "../http.js";
import type * as lib_openai from "../lib/openai.js";
import type * as lib_zod_entrySchemas from "../lib/zod/entrySchemas.js";
import type * as lib_zod_messageSchemas from "../lib/zod/messageSchemas.js";
import type * as lib_zod_sessionSchemas from "../lib/zod/sessionSchemas.js";
import type * as router from "../router.js";
import type * as sessions from "../sessions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auth: typeof auth;
  chat: typeof chat;
  cleanup: typeof cleanup;
  entries: typeof entries;
  http: typeof http;
  "lib/openai": typeof lib_openai;
  "lib/zod/entrySchemas": typeof lib_zod_entrySchemas;
  "lib/zod/messageSchemas": typeof lib_zod_messageSchemas;
  "lib/zod/sessionSchemas": typeof lib_zod_sessionSchemas;
  router: typeof router;
  sessions: typeof sessions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
