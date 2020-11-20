interface DecodedJWT {
    header: Record<string, any>;
    payload: Record<string, any>;
    signature: string;
    raw: {
        header: string;
        payload: string;
        signature: string;
    };
}

async function getGoogleSignatures(): Promise<JsonWebKey[]> {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
    const json = await response.json();
    return (json.keys as unknown) as JsonWebKey[];
}

export async function isValidJwt(request: Request): Promise<boolean> {
    try {
        const encodedToken = getJwtFromRequest(request);
        if (encodedToken == null) {
            return false;
        }
        const token = decodeJwt(encodedToken);

        // check token fields
        return (
            isValidJwtAudience(token) &&
            isValidJwtExpiry(token) &&
            isValidJwtIssuer(token) &&
            (await isValidJwtSignature(token))
        );
    }
    catch (e) {
        return false;
    }
}

function getJwtFromRequest(request: Request): string | null {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader.substring(0, 6) !== "Bearer") {
        return null;
    }
    return authHeader.slice("Bearer".length).trim();
}

function decodeJwt(encodedToken: string): DecodedJWT {
    const parts = encodedToken.split(".");
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const signature = atob(parts[2].replace(/_/g, "/").replace(/-/g, "+"));

    return {
        header: header,
        payload: payload,
        signature: signature,
        raw: {
            header: parts[0],
            payload: parts[1],
            signature: parts[2],
        },
    };
}

function isValidJwtAudience(token: DecodedJWT): boolean {
    // TODO
    return true;
}

function isValidJwtExpiry(token: DecodedJWT): boolean {
    return token.payload.exp * 1000 > Date.now();
}

function isValidJwtIssuer(token: DecodedJWT): boolean {
    return (
        token.payload.iss === "accounts.google.com" ||
        token.payload.iss === "https://accounts.google.com"
    );
}

async function isValidJwtSignature(token: DecodedJWT): Promise<boolean> {
    const encoder = new TextEncoder();
    const data = encoder.encode(
        [token.raw.header, token.raw.payload].join(".")
    );
    const signature = new Uint8Array(
        Array.from(token.signature).map((c) => c.charCodeAt(0))
    );

    const jwks = await getGoogleSignatures();
    for (const jwk of jwks) {
        const key = await crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["verify"]
        );
        const verified = await crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            key,
            signature,
            data
        );
        if (verified) {
            return true;
        }
    }
    return false;
}
