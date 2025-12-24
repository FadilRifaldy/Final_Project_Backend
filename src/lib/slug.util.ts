// Contoh: "iPhone 17 Pro 256GB Black" → "iphone-17-pro-256gb-black"

export function generateSlug(text: string): string {

    // 1. Lowercase semua
    // 2. Replace spasi dengan dash (-)
    // 3. Remove special characters (hanya alphanumeric dan dash)
    // 4. Remove multiple dashes jadi single dash
    // 5. Trim dash di awal/akhir

    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}