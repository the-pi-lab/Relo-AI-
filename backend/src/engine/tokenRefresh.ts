import type { Env } from "../db";
import {
  getAccountsDueForTokenRefresh,
  recordWebhookAuditLog,
  updateAccountToken,
} from "../db/queries";
import { decryptSecret, encryptSecret, getMasterKey } from "../crypto";
import { metaGraphClient } from "../meta/client";

/**
 * Long-lived Instagram tokens are good for ~60 days. Nothing in the request
 * path renews them, so without this job an account silently dies two months
 * after it was connected and every DM starts failing with Code 190.
 *
 * The job runs from the minute cron and is deliberately forgiving:
 *   - it only looks at accounts expiring inside the next 10 days,
 *   - it tries at most `limit` accounts per tick,
 *   - it skips anything already attempted in the last 12 hours (see
 *     `getAccountsDueForTokenRefresh`), so a rejection cannot become a loop,
 *   - a failure is logged and left alone. The creator still sees "reconnect
 *     needed" in Settings, which is the only path that can actually fix a
 *     revoked grant.
 */

/** Renew inside this window before expiry. */
const REFRESH_WINDOW_SECONDS = 10 * 24 * 60 * 60;

/** Meta returns `expires_in` seconds; fall back to the documented 60 days. */
const DEFAULT_TOKEN_LIFETIME_SECONDS = 60 * 24 * 60 * 60;

export interface TokenRefreshResult {
  scanned: number;
  refreshed: number;
  failed: number;
}

export async function refreshExpiringTokens(
  env: Env,
  options: { windowSeconds?: number; limit?: number } = {}
): Promise<TokenRefreshResult> {
  const result: TokenRefreshResult = { scanned: 0, refreshed: 0, failed: 0 };

  // Without app credentials there is nothing to exchange against. Not an error:
  // a self-hosted Worker may simply not have Meta configured yet.
  if (!env.META_APP_ID || !env.META_APP_SECRET) {
    return result;
  }

  const accounts = await getAccountsDueForTokenRefresh(
    env.DB,
    options.windowSeconds ?? REFRESH_WINDOW_SECONDS,
    options.limit ?? 10
  );
  result.scanned = accounts.length;
  if (accounts.length === 0) return result;

  const masterKey = getMasterKey(env);
  const now = Math.floor(Date.now() / 1000);

  for (const account of accounts) {
    try {
      // A page token cannot be renewed: Meta's `fb_exchange_token` grant only
      // accepts a USER token. Refresh the user token first, then re-derive the
      // page token from /me/accounts. Rows connected before that token was
      // stored cannot be refreshed — sending the page token would be a
      // guaranteed 400, so they are flagged for a reconnect instead.
      if (!account.userTokenEncrypted) {
        result.failed++;
        await recordWebhookAuditLog(env.DB, {
          accountId: account.id,
          eventType: "token_refresh_attempt",
          statusCode: 409,
          errorMessage:
            "No long-lived user token on file; the creator must reconnect this account.",
        });
        continue;
      }

      const userToken = await decryptSecret(account.userTokenEncrypted, masterKey);
      const renewed = await metaGraphClient.exchangeForLongLivedToken(
        env.META_APP_ID,
        env.META_APP_SECRET,
        userToken
      );

      if (!renewed.access_token) {
        throw new Error("Meta returned no access_token while refreshing.");
      }

      const lifetime = Number(renewed.expires_in) || DEFAULT_TOKEN_LIFETIME_SECONDS;
      const expiresAt = now + lifetime;

      // The fresh user token is re-exchanged into a fresh page token. Matching
      // on the Instagram account id keeps multi-page grants honest.
      const pages = await metaGraphClient.getConnectedAccounts(renewed.access_token);
      const page = pages.find((p) => p.instagramAccountId === account.instagramUserId);
      if (!page) {
        throw new Error(
          "The refreshed token no longer grants access to this Instagram account. Reconnect required."
        );
      }

      const encryptedPage = await encryptSecret(page.pageAccessToken, masterKey);
      const encryptedUser = await encryptSecret(renewed.access_token, masterKey);
      await updateAccountToken(
        env.DB,
        account.id,
        encryptedPage,
        expiresAt,
        encryptedUser,
        expiresAt
      );
      result.refreshed++;

      await recordWebhookAuditLog(env.DB, {
        accountId: account.id,
        eventType: "token_refresh_attempt",
        statusCode: 200,
        payload: JSON.stringify({ expiresAt, lifetime }),
      });
    } catch (err) {
      result.failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Token Refresh] @${account.username} could not be renewed: ${message}`);

      await recordWebhookAuditLog(env.DB, {
        accountId: account.id,
        eventType: "token_refresh_attempt",
        statusCode: 502,
        errorMessage: message.slice(0, 500),
      }).catch(() => undefined);
    }
  }

  return result;
}
