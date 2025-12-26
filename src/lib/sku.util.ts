// sku ini untuk bikin sistem kode barang buat product variants

export function generateSKU(
    productCode: string,
    color?: string,
    size?: string,
    counter: number = 1
) {
    const parts: string[] = [productCode]

    if (color) {
        if (color.length > 2) {
            color = color.slice(0, 3)
        }
        parts.push(color.toUpperCase())
    }

    if (size) {
        parts.push(size.toUpperCase())
    }
    parts.push(counter.toString())
    return parts.join("-")
}