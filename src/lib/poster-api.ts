// src/lib/poster-api.ts

const POSTER_TOKEN = process.env.POSTER_TOKEN || '';
if (!POSTER_TOKEN) {
    console.warn("WARNING: POSTER_TOKEN is not defined in environment variables!");
}
const POSTER_ACCOUNT = 'galia-baluvana34';

export interface PosterStorage {
    storage_id: string;
    storage_name: string;
    storage_adress?: string;
    delete?: string;
}

export interface PosterLeftover {
    ingredient_id: string;      // Poster uses ingredient_id for leftovers internally, though the prompt mentioned product_id. Let's type it mostly loosely.
    product_id?: string;
    ingredient_name: string;
    product_name?: string;
    category_name: string;
    count: string | number;
    limit: string | number;
    unit: string;
}

export interface StorageLeftoverResult {
    storage_id: string;
    storage_name: string;
    leftovers: PosterLeftover[];
}

/**
 * Core function to make requests to the JoinPoster API
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function posterRequest(method: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
    url.searchParams.append('token', POSTER_TOKEN);

    Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
        response = await fetch(url.toString(), {
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        throw new Error(`Poster API error [${method}]: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetches the list of all active storages
 */
export async function getStorages(): Promise<PosterStorage[]> {
    const data = await posterRequest('storage.getStorages');
    return data.response || [];
}

/**
 * Fetches all leftovers (stock) for a specific storage ID
 */
export async function getStorageLeftovers(storageId: string): Promise<PosterLeftover[]> {
    const data = await posterRequest('storage.getStorageLeftovers', {
        storage_id: storageId
    });
    return data.response || [];
}

/**
 * Fetches all leftovers across ALL storages in parallel (Fast!)
 */
export async function getAllLeftovers(): Promise<StorageLeftoverResult[]> {
    const storages = await getStorages();

    // Fetch leftovers for all storages in parallel
    const promises = storages.map(async (storage) => {
        try {
            const leftovers = await getStorageLeftovers(storage.storage_id);
            return {
                storage_id: storage.storage_id,
                storage_name: storage.storage_name,
                leftovers: leftovers
            };
        } catch (error) {
            console.error(`Error fetching leftovers for storage ${storage.storage_id} (${storage.storage_name}):`, error);
            // Return empty leftovers for this storage rather than failing the whole batch
            return {
                storage_id: storage.storage_id,
                storage_name: storage.storage_name,
                leftovers: []
            };
        }
    });

    return await Promise.all(promises);
}
