// Hàm loại bỏ stop words tiếng Việt (cơ bản) và các ký tự không cần thiết
const stopWords = new Set(['là', 'và', 'của', 'có', 'trong', 'để', 'được', 'với', 'cho', 'không', 'các', 'một', 'những']);

function preprocessText(text: string): string[] {
  if (!text) return [];
  // Chuyển thành chữ thường và tách từ bằng regex (không cần thư viện external)
  const tokens = text.toLowerCase().split(/[\s,.\-_!?()[\]{}:;/\\|"']+/).filter(Boolean);
  // Lọc stop words và từ quá ngắn
  return tokens.filter((token: string) => token.length > 1 && !stopWords.has(token));
}


// Simple hash function for string (djb2 algorithm)
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
  }
  return Math.abs(hash);
}

/**
 * Tính toán vector đặc trưng (Feature Vector) sử dụng Hashing Trick
 * Để map các từ khóa vào không gian 500 chiều cố định.
 * 
 * Mặc dù tên gọi phổ thông là TF-IDF, trong môi trường Streaming (Message Queue)
 * Hashing TF (Term Frequency) là phương pháp tối ưu nhất để sinh vector cố định 
 * mà không cần phải load toàn bộ dữ liệu trong DB ra mỗi lần tính toán.
 */
export function generateFeatureVector(name: string, description: string, categoryName: string = ''): number[] {
  const DIMENSIONS = 384;
  const vector = new Array(DIMENSIONS).fill(0);
  
  // Trọng số cho các trường dữ liệu
  const WEIGHT_NAME = 3.0;
  const WEIGHT_CATEGORY = 2.0;
  const WEIGHT_DESC = 1.0;

  const nameTokens = preprocessText(name);
  const catTokens = preprocessText(categoryName);
  const descTokens = preprocessText(description);

  // Apply term frequencies with weights
  nameTokens.forEach(token => {
    const bucket = hashString(token) % DIMENSIONS;
    vector[bucket] += WEIGHT_NAME;
  });

  catTokens.forEach(token => {
    const bucket = hashString(token) % DIMENSIONS;
    vector[bucket] += WEIGHT_CATEGORY;
  });

  descTokens.forEach(token => {
    const bucket = hashString(token) % DIMENSIONS;
    vector[bucket] += WEIGHT_DESC;
  });

  // L2 Normalization (chuẩn hóa vector để thuật toán Cosine hoạt động tốt hơn)
  let magnitude = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    magnitude += vector[i] * vector[i];
  }
  magnitude = Math.sqrt(magnitude);

  if (magnitude > 0) {
    for (let i = 0; i < DIMENSIONS; i++) {
      vector[i] = vector[i] / magnitude;
    }
  }

  return vector;
}
