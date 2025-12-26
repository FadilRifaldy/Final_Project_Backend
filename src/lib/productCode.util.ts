export function extractProductCode(productName: string) {
    const words = productName.trim().split(/\s+/);
    let code = ''
    let numbers = ''

    for (const word of words) {
        const hasNumber = /\d/.test(word)
        if (hasNumber) {
            numbers += word.match(/\d+/)?.[0] || ''
        } else {
            code += word.charAt(0).toUpperCase()
        }
    }
    return (code + numbers).toUpperCase()
}