/**
 * FFTデータをJSONファイルから読み込む
 * @param {string} id - FFTファイルのID（ファイル名の拡張子を除いた部分）
 * @returns {Promise<Object>} - FFTデータのJSONオブジェクトを返すPromise
 * @throws {Error} - ファイルの読み込みに失敗した場合やJSON形式でない場合
 */
export async function fetchFFTData(id) {
  const url = `/fft/${id}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load json from ${url}`);
  }
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error(`Expected JSON but got ${contentType}`);
  }
  return await response.json();
}
