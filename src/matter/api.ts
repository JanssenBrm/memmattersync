export const CLIENT_TYPE = 'integration';
export const MATTER_API_VERSION = 'v11';
export const MATTER_API_DOMAIN = 'api.getmatter.app';
export const MATTER_API_HOST = `https://${MATTER_API_DOMAIN}/api/${MATTER_API_VERSION}`;
export const ENDPOINTS = {
    QR_LOGIN_TRIGGER: `${MATTER_API_HOST}/qr_login/trigger/`,
    QR_LOGIN_EXCHANGE: `${MATTER_API_HOST}/qr_login/exchange/`,
    REFRESH_TOKEN_EXCHANGE: `${MATTER_API_HOST}/token/refresh/`,
    HIGHLIGHTS_FEED: `${MATTER_API_HOST}/library_items/highlights_feed/`
}
