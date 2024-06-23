export async function BlobToDataUrl(blob: Blob): Promise<string> {
    const reader = new FileReader()

    return new Promise<string>((resolve, reject) => {
        reader.onerror = () => reject(reader.error as DOMException)
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
    })
}
