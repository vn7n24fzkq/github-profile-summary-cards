import {restRequest} from '../utils/request';
import {withDataCache} from '../utils/data-cache';

export type OwnerType = 'User' | 'Organization';

export async function getOwnerType(login: string, token: string): Promise<OwnerType> {
    // An account's type practically never changes — cache it for a week.
    return withDataCache(
        `v1:ot:${login.toLowerCase()}`,
        async () => {
            // REST instead of GraphQL: the type lookup needs nothing GraphQL-only,
            // and the REST quota pool is otherwise idle (see restRequest).
            let res;
            try {
                res = await restRequest(token, `/users/${encodeURIComponent(login)}`);
            } catch (err: any) {
                // Keep the long-standing error message for unknown logins; other
                // failures (rate limits, 5xx) propagate untouched so token
                // rotation and error classification behave as before.
                if (err?.response?.status === 404) {
                    throw Error(`Login not found: ${login}`);
                }
                throw err;
            }

            const typename = res.data?.type;
            if (typename !== 'User' && typename !== 'Organization') {
                throw Error(`Unsupported owner type for ${login}: ${typename}`);
            }

            return typename as OwnerType;
        },
        7 * 24 * 60 * 60
    );
}
