/**
 * Generates a slug from a string.
 * A slug is a URL-friendly version of a string, typically used in URLs.
 * @param text The string to slugify.
 * @returns The slugified string.
 */
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars except hyphen
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -

export function generateWillyWeatherUrl(locationName: string, region: string, state: string): string {
  return `https://wind.willyweather.com.au/${state.toLowerCase()}/${slugify(region)}/${slugify(locationName)}.html`;
}