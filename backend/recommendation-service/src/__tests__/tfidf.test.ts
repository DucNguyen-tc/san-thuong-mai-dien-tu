import { generateFeatureVector } from '../utils/tfidf';

describe('Recommendation Service - TF-IDF Vector Generation', () => {
  test('Phải sinh ra vector đúng 384 chiều (dimensions)', () => {
    const vector = generateFeatureVector('Áo thun nam', 'Áo thun cotton thoáng mát', 'Thời trang nam');
    expect(Array.isArray(vector)).toBe(true);
    expect(vector.length).toBe(384);
  });

  test('Phải xử lý an toàn khi các tham số đầu vào là chuỗi rỗng', () => {
    const vector = generateFeatureVector('', '', '');
    expect(vector.length).toBe(384);
    // Khi rỗng, toàn bộ vector có giá trị là 0
    expect(vector.every(val => val === 0)).toBe(true);
  });

  test('Phải chuẩn hóa vector L2 normalization (độ dài vector / magnitude = 1.0 khi có dữ liệu)', () => {
    const vector = generateFeatureVector('Giày chạy bộ', 'Giày thề thao siêu nhẹ', 'Giày dép');
    let magnitude = 0;
    for (const val of vector) {
      magnitude += val * val;
    }
    magnitude = Math.sqrt(magnitude);
    expect(magnitude).toBeCloseTo(1.0, 5);
  });

  test('Các sản phẩm cùng loại phải có độ tương đồng Cosine cao hơn sản phẩm khác loại', () => {
    const vectorShirt1 = generateFeatureVector('Áo sơ mi nam', 'Áo sơ mi tay dài cao cấp', 'Áo nam');
    const vectorShirt2 = generateFeatureVector('Áo sơ mi nữ', 'Áo sơ mi lụa công sở', 'Áo nữ');
    const vectorPhone = generateFeatureVector('Điện thoại iPhone 15', 'Màn hình OLED chip A17', 'Điện thoại');

    // Hàm tính Cosine Similarity (Dot product của 2 vector đã chuẩn hóa L2)
    const cosineSimilarity = (v1: number[], v2: number[]) => {
      let dot = 0;
      for (let i = 0; i < v1.length; i++) {
        dot += v1[i] * v2[i];
      }
      return dot;
    };

    const simShirtToShirt = cosineSimilarity(vectorShirt1, vectorShirt2);
    const simShirtToPhone = cosineSimilarity(vectorShirt1, vectorPhone);

    expect(simShirtToShirt).toBeGreaterThan(simShirtToPhone);
  });
});
