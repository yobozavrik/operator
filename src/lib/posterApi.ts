// Next.js uses native fetch, no need for node-fetch

const POSTER_TOKEN = (process.env.POSTER_TOKEN || '').trim();
const POSTER_ACCOUNT = 'galia-baluvana34';

export interface PosterStorage {
    storage_id: string;
    storage_name: string;
    storage_adress: string;
    delete: string;
}

export interface PosterLeftover {
    ingredient_id: string;
    ingredient_name: string;
    ingredient_left: string;
    storage_ingredient_left?: string;
    ingredient_unit: string;
}

export interface StorageWithLeftovers {
    storage_id: string;
    storage_name: string;
    leftovers: PosterLeftover[];
}

export async function posterRequest(method: string, params: Record<string, string> = {}) {
    if (!POSTER_TOKEN) {
        throw new Error("POSTER_TOKEN environment variable is missing.");
    }

    const url = new URL(`https://${POSTER_ACCOUNT}.joinposter.com/api/${method}`);
    url.searchParams.append('token', POSTER_TOKEN);

    Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
    );

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Poster API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
        throw new Error(`Poster API Error response: ${data.error}`);
    }
    return data;
}

export async function getCategories() {
    console.time('Poster API fetch categories');
    const categoriesData = await posterRequest('menu.getCategories');
    console.timeEnd('Poster API fetch categories');
    return categoriesData.response || [];
}

export async function getProducts() {
    console.time('Poster API fetch products');
    const productsData = await posterRequest('menu.getProducts');
    console.timeEnd('Poster API fetch products');
    return productsData.response || [];
}

export async function getAllLeftovers(): Promise<StorageWithLeftovers[]> {
    // 1. Fetch categories to find Konditerka and Morozivo IDs
    const categories = await getCategories();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetCategories = categories.filter((c: any) =>
        c.category_name.toLowerCase().includes('кондитерка') ||
        c.category_name.toLowerCase().includes('морозиво')
    );
    const targetCategoryIds = targetCategories.map((c: any) => c.category_id);

    // 2. Fetch all products and filter by these category IDs
    const products = await getProducts();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const konditerkaProducts = products.filter((p: any) =>
        targetCategoryIds.includes(p.menu_category_id)
    );
    // Poster products that correspond to ingredients in the warehouse have an ingredient_id (string/number)
    const KONDITERKA_INGREDIENT_IDS = konditerkaProducts.map((p: any) => p.ingredient_id).filter(Boolean).map(String);

    console.time('Poster API fetch storages');
    const storagesData = await posterRequest('storage.getStorages');
    const allStorages: PosterStorage[] = storagesData.response || [];

    // EXCLUDE factory storage & Tseks from the retail stock calculations
    const storages = allStorages.filter(s => {
        const name = s.storage_name.toLowerCase();
        return !name.includes('склад "кондитерка"') &&
            !name.includes('цех') &&
            !name.includes('переміщення') &&
            !name.includes('списання');
    });
    console.timeEnd('Poster API fetch storages');

    console.time('Poster API fetch leftovers parallel');
    // Паралельно витягуємо залишки з усіх складів
    const promises = storages.map(async (storage) => {
        const data = await posterRequest('storage.getStorageLeftovers', {
            storage_id: storage.storage_id
        });

        // 3. Filter the leftovers to only include those belonging to Konditerka/Morozivo
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawLeftovers = (data.response || []) as PosterLeftover[];
        const filteredLeftovers = rawLeftovers.filter(item =>
            KONDITERKA_INGREDIENT_IDS.includes(String(item.ingredient_id))
        );

        return {
            storage_id: storage.storage_id,
            storage_name: storage.storage_name,
            leftovers: filteredLeftovers
        };
    });

    const results = await Promise.all(promises);
    console.timeEnd('Poster API fetch leftovers parallel');

    return results;
}

export async function getTodayManufactures() {
    // 1. Storage ID for Konditerka Factory
    const KONDITERKA_FACTORY_ID = 48; // Склад "Кондитерка"

    // 2. Date range for today
    const dateStr = new Date().toISOString().split('T')[0];

    // 3. Fetch categories to find Konditerka and Morozivo IDs
    const categories = await getCategories();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetCategories = categories.filter((c: any) =>
        c.category_name.toLowerCase().includes('кондитерка') ||
        c.category_name.toLowerCase().includes('морозиво')
    );
    const targetCategoryIds = targetCategories.map((c: any) => c.category_id);

    // 4. Fetch all products and filter by these category IDs
    const products = await getProducts();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const konditerkaProducts = products.filter((p: any) =>
        targetCategoryIds.includes(p.menu_category_id)
    );
    const KONDITERKA_PRODUCT_IDS = konditerkaProducts.map((p: any) => p.product_id).filter(Boolean).map(String);

    // 5. Fetch manufactures for today
    console.time('Poster API fetch manufactures');
    const manufacturesData = await posterRequest('storage.getManufactures', {
        dateFrom: dateStr,
        dateTo: dateStr
    });
    console.timeEnd('Poster API fetch manufactures');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manufactures = (manufacturesData.response || []) as any[];

    // 6. Filter by factory and extract relevant products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const factoryManufactures = manufactures.filter((m: any) => String(m.storage_id) === String(KONDITERKA_FACTORY_ID));

    // We only care about products inside these manufactures that belong to Konditerka/Morozivo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const producedItems: any[] = [];

    for (const manufacture of factoryManufactures) {
        if (manufacture.products && Array.isArray(manufacture.products)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const relevantProducts = manufacture.products.filter((p: any) =>
                KONDITERKA_PRODUCT_IDS.includes(String(p.product_id))
            );
            producedItems.push(...relevantProducts);
        }
    }

    return producedItems;
}
