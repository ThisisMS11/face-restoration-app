const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
}

export class APIError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export const fetchClient = async <T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> => {
    if (!BASE_URL) {
        throw new Error('App URL environment variable is not configured');
    }

    const { params, ...fetchOptions } = options;
    let url = `${BASE_URL}/api/v1/${endpoint}`;

    if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...fetchOptions,
    });

    if (!response.ok) {
        throw new APIError(
            response.status,
            `HTTP error! status: ${response.status}`
        );
    }

    return response.json();
};
