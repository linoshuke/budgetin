export class ServiceError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = "ServiceError";
        this.statusCode = statusCode;
    }
}

export function handleServiceError(error: unknown): {
    body: { error: string };
    status: number;
} {
    if (error instanceof ServiceError) {
        if (error.statusCode >= 500) {
            console.error("[ServiceError 500]", error.message);
            return {
                body: { error: "Terjadi kesalahan pada server." },
                status: error.statusCode,
            };
        }

        return {
            body: { error: error.message },
            status: error.statusCode,
        };
    }

    console.error("[Unexpected Error]", error instanceof Error ? error.message : error);
    return {
        body: { error: "Terjadi kesalahan tak terduga." },
        status: 500,
    };
}
