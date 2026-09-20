/** Parse an API body as JSON. HTML 500 pages used to crash checkout with
 *  `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`. */
export async function readApiJson<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty reply from the shop. Please try again.');
  }
  if (trimmed.startsWith('<')) {
    throw new Error('The shop server is busy. Please try again in a moment.');
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error('The shop server sent a bad reply. Please try again.');
  }
}
