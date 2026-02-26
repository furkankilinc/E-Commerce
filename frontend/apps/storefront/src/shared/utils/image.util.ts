/**
 * Generates a sized image URL based on the original URL and the requested size.
 * Our backend generates 4 versions: _small, _medium, _large, _original
 * 
 * @param url The original image URL (ending in _original.webp)
 * @param size The requested size: 'small' | 'medium' | 'large' | 'original'
 * @returns The URL of the requested size
 */
export const getSizedImageUrl = (url: any, size: 'small' | 'medium' | 'large' | 'original' = 'medium'): string | undefined => {
    if (!url || typeof url !== 'string') return undefined;

    // If the URL already contains the pattern, replace it
    if (url.includes('_original.webp')) {
        return url.replace('_original.webp', `_${size}.webp`);
    }

    // Fallback if the URL doesn't follow the pattern (for old images)
    return url;
};
