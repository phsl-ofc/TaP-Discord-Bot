import axios, { AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

/**
 * Get tokens from local cookies
 * @returns currently stored security tokens
 */
export function getTokens() {
    return {
        accessToken: Cookies.get("access_token") ?? null,
        refreshToken: Cookies.get("refresh_token") ?? null,
    };
}

/**
 * Set token values into local cookies
 * @param accessToken
 * @param refreshToken
 */
export function setTokens(accessToken: string, refreshToken: string) {
    if (accessToken) {
        Cookies.set("access_token", accessToken, {
            expires: 7,
            sameSite: "strict",
            secure: true,
        });
    }
    if (refreshToken) {
        Cookies.set("refresh_token", refreshToken, {
            expires: 365,
            sameSite: "strict",
            secure: true,
        });
    }
}

/**
 * Clear cookies used for tokens
 */
export function clearTokens() {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
}

/**
 * Get backend to supply us a new accessToken using our refreshToken
 */
export async function refreshTokens() {
    const { refreshToken } = getTokens();

    // verify token is defined
    if (!refreshToken) {
        return;
    }

    const config: AxiosRequestConfig = {
        params: { refreshToken },
    };

    // try to make the request
    let response;
    try {
        response = await axios.get(
            process.env.REACT_APP_BACKEND_ADDRESS + "/auth/refresh",
            config
        );
        setTokens(response.data.access_token, response.data.refresh_token);
    } catch (err: any) {
        if (err.isAxiosError) {
            // the tokens are invalid therefore get rid of them
            clearTokens();
        } else {
            throw err;
        }
    }
}

/**
 * Get backend to unauthenticated our tokens
 */
export async function revokeToken() {
    const { refreshToken } = getTokens();

    // verify token is defined
    if (!refreshToken) {
        return;
    }

    const config: AxiosRequestConfig = {
        params: { refreshToken },
    };

    // try to make the request
    try {
        await axios.get(
            process.env.REACT_APP_BACKEND_ADDRESS + "/auth/revoke",
            config
        );
    } catch (err: any) {
        if (!err.isAxiosError) {
            throw err;
        }
    }
}
