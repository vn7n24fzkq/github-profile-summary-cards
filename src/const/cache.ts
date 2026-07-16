// s-maxage 48h: cards change slowly and the CDN hit rate directly drives the
// free-tier budget (every CDN miss is a function invocation plus Redis
// commands). Browsers/camo still refresh every 4h; SWR keeps a week of
// serve-stale-while-refreshing on top.
export const CONST_CACHE_CONTROL = 'public, max-age=14400, s-maxage=172800, stale-while-revalidate=604800';
