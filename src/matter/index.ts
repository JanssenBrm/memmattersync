import {CLIENT_TYPE, ENDPOINTS} from "./api";
import fetch from 'node-fetch'
import * as QRCode from 'qrcode';
import * as fs from "fs";
import {createDir, sleep} from "../utils";
import {Article, ArticleResponse, MatterAuth} from "./models";


export class MatterAPI {

    private BASE = './files/matter';
    private QR_FILE = `${this.BASE}/login.svg`
    private TOKEN_FILE = `${this.BASE}/tokens.json`

    private tokens: MatterAuth = undefined;

    constructor() {
       createDir(this.BASE);
    }


    // ARTICLES

    /**
     * Get a list of all articles in your feed
     */
    public async getArticles(): Promise<Article[]> {
        let url = ENDPOINTS.HIGHLIGHTS_FEED;
        let articles: Article[] = [];

        // Load all feed items new to old.
        while (url !== null) {
            const response: ArticleResponse = await this.executeRequest(url);
            articles = [...articles, ...response.feed];
            url = response.next;
        }

        articles = articles.reverse();
        return articles;
    }

    /**
     * Get a list of all articles for which highlights were added
     */
    public async getHighlightedArticles(): Promise<Article[]> {
        const articles: Article[] = await this.getArticles();
        return articles.filter((a: Article) => a.content.my_annotations?.length > 0 && a.content.history.max_read_percentage == 1.00);
    }

    // UTILS

    /**
     * Execute a request to the Matter API. The function will automatically refresh the access tokens in case
     * an error is returned by the API
     * @param url - URL endpoint to which a request should be sent
     * @param args - Amy arguments that should be added to the request
     * @private
     */
    private async executeRequest(url: string, args: any = {}) {
        this.checkTokens();
        try {
            return (await this.executeAuthRequest(this.tokens, url, args));
        } catch (e) {
            await this.refreshTokens();
            return (await this.executeAuthRequest(this.tokens, url, args));
        }
    }


    /**
     * Execute an authenticated request object that can be used for the communication with the Matter API
     * @param auth - Authentication tokens that can be added to the request header
     * @param url - URL to which the request should be sent
     * @param args - Any arguments that should be added to the call
     * @private
     */
    private async executeAuthRequest(
        auth: MatterAuth,
        url: string,
        args: any = {},
    ) {
        const headers = new fetch.Headers();
        headers.set('Authorization', `Bearer ${auth.access_token}`);
        headers.set('Content-Type', 'application/json');

        const response = await fetch(url, {
            ...args,
            headers,
        });

        if (!response.ok) {
            const message = 'Matter - could not execute authenticated request'
            console.error(`\x1b[1m\x1b[91mERROR\x1b[0m - ${message}`, response);
            throw new Error(message);
        }

        return (await response.json());
    }

    // AUTHENTICATION

    /**
     * Try to log in the current user. In Matter this is done by generating a QR code based on a token. This QR code
     * needs to be scanned through the app. Meanwhile, an additional request needs to be executed in order to check if
     * the token was scanned by the app. Afterwards, this token can be exchanged for a valid access and refresh token.
     */
    async login(): Promise<void> {
        let tokens = undefined;
        try {
            if (fs.existsSync(this.TOKEN_FILE)) {
                console.info(`\x1b[2mTokens (${this.TOKEN_FILE}) file exists, no login procedure started!\x1b[0m`);
                tokens = JSON.parse(fs.readFileSync(this.TOKEN_FILE).toString()) as MatterAuth;
            } else {
                const headers = new fetch.Headers();
                headers.set('Content-Type', 'application/json');

                const triggerResponse = await fetch(ENDPOINTS.QR_LOGIN_TRIGGER, {
                    method: "POST",
                    body: JSON.stringify({client_type: CLIENT_TYPE}),
                    headers,
                });
                const token = (await triggerResponse.json()).session_token;
                await this.createLoginQr(token);
                console.info(`\x1b[1m\x1b[93mLOGIN\x1b[0m - Created QR code at \x1b[1m\x1b[92m${this.QR_FILE}\x1b[0m. Scan this file with your Matter app! \x1b[2m(Profile > Sign into Web)\x1b[0m`);
                tokens = await this.pollLoginExchange(token);
                await this.saveTokens(tokens);
                console.info(`\x1b[2mSaved tokens to ${this.TOKEN_FILE}\x1b[0m`);
                fs.unlinkSync(this.QR_FILE);
            }
        } catch (error) {
            console.error('\x1b[1m\x1b[91mERROR\x1b[0m - Could not login into Matter', error);
            tokens = undefined;
        }
        this.tokens = tokens;
    }

    /**
     * Check if the access tokens exists. If something is wrong, an error is thrown.
     */
    public checkTokens(): void {
        if (!this.tokens) {
            throw new Error('Tokens are not available, please login first!');
        }
    }

    /**
     * Create a QR code for the Matter login token
     * @param token - Login token
     * @private
     */
    private async createLoginQr(token: string): Promise<void> {
        const url = await QRCode.toString(token, {type: 'svg'});
        fs.writeFileSync(this.QR_FILE, url);
    }

    /**
     * Save the current access tokens to a file
     * @param auth - Auth object containing the access and refresh tokens
     * @private
     */
    private async saveTokens(auth: MatterAuth): Promise<void> {
        fs.writeFileSync(this.TOKEN_FILE, JSON.stringify(auth));
    }

    /**
     * Check if the user has scanned the QR code with the Matter app. This is done by checking if the login token
     * (which is in the QR code) can be exchanged.
     * @param token - Login token
     * @private
     */
    private async pollLoginExchange(token): Promise<MatterAuth> {
        let attempts = 0;
        while (attempts < 600) {
            try {
                const loginSession = await this.exchangeLoginCode(token);
                if (loginSession?.access_token) {
                    return {
                        access_token: loginSession.access_token,
                        refresh_token: loginSession.refresh_token,
                    };
                }
            } finally {
                attempts++;
                await sleep(1000);
            }
        }
        throw new Error(`Could not login with Matter after ${attempts} attemtps`);
    }

    /**
     * Exchange the login token with an actual access and refresh token. Only after scanning the QR code and
     * giving permissions in the Matter app, the token will be exchanged for the required tokens.
     * @param token - Login token that should be exchanged
     * @private
     */
    private async exchangeLoginCode(token: string): Promise<any> {
        const headers = new fetch.Headers();
        headers.set('Content-Type', 'application/json');
        const response = await fetch(ENDPOINTS.QR_LOGIN_EXCHANGE, {
            method: "POST",
            body: JSON.stringify({
                session_token: token
            }),
            headers,
        });
        return response.json();
    }
    /**
     * Refresh the access token
     * @private
     */
    private async refreshTokens() {
        console.info('Refreshing access tokens')
        const headers = new fetch.Headers();
        headers.set('Content-Type', 'application/json');
        const response = await fetch(ENDPOINTS.REFRESH_TOKEN_EXCHANGE, {
            method: 'POST',
            headers,
            body: JSON.stringify({refresh_token: this.tokens.refresh_token})
        });
        const payload = await response.json();
        this.tokens.access_token = payload.access_token;
        this.tokens.refresh_token = payload.refresh_token;
        await this.saveTokens(this.tokens);

        if (!this.tokens.access_token) {
            console.error('\x1b[1m\x1b[91mERROR\x1b[0m - Could not refresh access token', payload);
            throw new Error("Could not refresh access token");
        } else {
            console.info('Tokens successfully refreshed');
        }
    }

}
