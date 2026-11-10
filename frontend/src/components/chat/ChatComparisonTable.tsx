import React from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Scale,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type {
  ComparisonAttribute,
  ComparisonTableMetadata,
  ProductProsCons,
} from '@/types/aiChat';

interface ChatComparisonTableProps {
  data: ComparisonTableMetadata;
}

/**
 * Render chuỗi có chứa **bold** markdown
 */
function renderBoldMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-amber-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Trích xuất con số đại diện từ chuỗi thông số để so sánh tự động
 */
function extractPrimaryMetricValue(attrName: string, rawVal: string): number | null {
  if (!rawVal) return null;
  const lowerAttr = attrName.toLowerCase();

  // Nếu là hàng Giá bán -> bỏ dấu chấm/phẩy phân cách hàng nghìn (VD: 28.990.000đ -> 28990000)
  if (lowerAttr.includes('giá')) {
    const digitsOnly = rawVal.replace(/[^\d]/g, '');
    const num = Number(digitsOnly);
    return Number.isFinite(num) && num > 0 ? num : null;
  }

  // Nếu là RAM / Bộ nhớ (VD: "12GB / 256GB") -> lấy số đầu tiên (RAM)
  const match = rawVal.replace(',', '.').match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return Number.isFinite(val) ? val : null;
}

/**
 * Xác định cột nào có thông số tốt nhất (winner) và kém ưu thế nhất (loser) trên từng hàng
 */
function evaluateRowComparison(attr: ComparisonAttribute): {
  bestIndices: number[];
  worstIndices: number[];
  isPriceRow: boolean;
} {
  const lowerName = attr.name.toLowerCase();
  const isPriceRow = lowerName.includes('giá');
  const isLowerBetter =
    isPriceRow ||
    lowerName.includes('trọng lượng') ||
    lowerName.includes('khối lượng');
  const isComparableMetric =
    isLowerBetter ||
    ['ram', 'pin', 'battery', 'camera', 'màn hình', 'sạc', 'tần số', 'chip', 'bộ nhớ', 'zoom'].some(
      (kw) => lowerName.includes(kw)
    );

  if (!isComparableMetric) {
    return { bestIndices: [], worstIndices: [], isPriceRow };
  }

  const numericValues = attr.values.map((v) =>
    extractPrimaryMetricValue(attr.name, v)
  );
  const validNums = numericValues.filter(
    (n): n is number => n !== null && !Number.isNaN(n)
  );

  // Chỉ highlight khi có ít nhất 2 giá trị số khác nhau
  if (validNums.length < 2) {
    return { bestIndices: [], worstIndices: [], isPriceRow };
  }

  const minVal = Math.min(...validNums);
  const maxVal = Math.max(...validNums);
  if (minVal === maxVal) {
    return { bestIndices: [], worstIndices: [], isPriceRow };
  }

  const targetBest = isLowerBetter ? minVal : maxVal;
  const targetWorst = isLowerBetter ? maxVal : minVal;

  const bestIndices: number[] = [];
  const worstIndices: number[] = [];

  numericValues.forEach((n, idx) => {
    if (n === targetBest) bestIndices.push(idx);
    else if (n === targetWorst) worstIndices.push(idx);
  });

  return { bestIndices, worstIndices, isPriceRow };
}

/**
 * Tự động tổng hợp Ưu / Nhược điểm cho từng sản phẩm (2-4 sản phẩm)
 * nếu Backend chưa truyền sẵn mảng `highlights`
 */
function buildProductProsCons(data: ComparisonTableMetadata): ProductProsCons[] {
  if (Array.isArray(data.highlights) && data.highlights.length > 0) {
    return data.highlights.slice(0, 4);
  }

  const products = data.products.slice(0, 4);
  const prosMap: string[][] = products.map(() => []);
  const consMap: string[][] = products.map(() => []);

  for (const attr of data.attributes || []) {
    const { bestIndices, worstIndices, isPriceRow } = evaluateRowComparison(attr);

    bestIndices.forEach((colIdx) => {
      if (colIdx < products.length && attr.values[colIdx]) {
        const label = isPriceRow
          ? `Giá tốt hơn (${attr.values[colIdx]})`
          : `${attr.name} nổi bật (${attr.values[colIdx]})`;
        prosMap[colIdx].push(label);
      }
    });

    worstIndices.forEach((colIdx) => {
      if (colIdx < products.length && attr.values[colIdx]) {
        const label = isPriceRow
          ? `Giá cao hơn (${attr.values[colIdx]})`
          : `${attr.name} thấp hơn (${attr.values[colIdx]})`;
        consMap[colIdx].push(label);
      }
    });
  }

  // Bổ sung nhận xét mặc định nếu có sản phẩm chưa có pros hoặc cons từ số học
  return products.map((prodName, idx) => {
    const pros = prosMap[idx].slice(0, 3);
    const cons = consMap[idx].slice(0, 2);

    if (pros.length === 0) {
      const chipOrScreen = data.attributes?.find((a) =>
        /chip|vi xử lý|màn hình/i.test(a.name)
      )?.values?.[idx];
      pros.push(
        chipOrScreen
          ? `Cấu hình ổn định (${chipOrScreen})`
          : 'Thiết kế cao cấp, hiệu năng cân bằng'
      );
    }

    if (cons.length === 0) {
      cons.push('Cần cân nhắc theo nhu cầu sử dụng thực tế');
    }

    return {
      product: prodName,
      pros,
      cons,
    };
  });
}

export default function ChatComparisonTable({ data }: ChatComparisonTableProps) {
  if (!data || !Array.isArray(data.products) || data.products.length === 0) {
    return null;
  }

  // Giới hạn chuẩn 2-4 sản phẩm theo đặc tả Ngày 6-7
  const products = data.products.slice(0, 4);
  const prosConsList = buildProductProsCons(data);

  return (
    <div className="mt-2.5 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
      {/* Header Bảng so sánh */}
      <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50/70 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          <Scale className="w-3.5 h-3.5" />
          <span>So sánh chi tiết ({products.length} sản phẩm)</span>
        </div>
        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded font-medium">
          ⚡ Tự động highlight ưu thế
        </span>
      </div>

      {/* Bảng thông số kỹ thuật (Hỗ trợ cuộn ngang mượt cho 2-4 sản phẩm) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/90 border-b border-gray-200">
              <th className="py-2 px-2.5 font-semibold text-gray-600 w-24 shrink-0 sticky left-0 bg-gray-50 z-10">
                Tiêu chí
              </th>
              {products.map((prodName, idx) => (
                <th
                  key={idx}
                  className="py-2 px-2.5 font-bold text-gray-900 min-w-[125px] border-l border-gray-100"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.2 rounded">
                      SP {idx + 1}
                    </span>
                  </div>
                  <div className="line-clamp-2 leading-snug text-primary">
                    {prodName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.attributes?.map((attr, rowIdx) => {
              const { bestIndices, isPriceRow } = evaluateRowComparison(attr);

              return (
                <tr
                  key={rowIdx}
                  className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                >
                  <td className="py-2 px-2.5 font-medium text-gray-600 sticky left-0 bg-inherit z-10">
                    {attr.name}
                  </td>
                  {products.map((_, colIdx) => {
                    const cellVal = attr.values?.[colIdx] ?? '—';
                    const isBest = bestIndices.includes(colIdx);

                    return (
                      <td
                        key={colIdx}
                        className={`py-2 px-2.5 border-l border-gray-100 align-top ${
                          isBest
                            ? 'bg-emerald-50/60 font-semibold text-emerald-900'
                            : 'text-gray-800'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span>{cellVal}</span>
                          {isBest && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700">
                              <TrendingUp className="w-2.5 h-2.5" />
                              {isPriceRow ? 'Giá tốt nhất' : 'Vượt trội'}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Khu vực Highlight Ưu / Nhược điểm của mỗi sản phẩm */}
      <div className="p-2.5 bg-slate-50/80 border-t border-gray-200">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 mb-2">
          <Award className="w-3.5 h-3.5 text-primary" />
          <span>Highlight Ưu / Nhược điểm từng sản phẩm:</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {prosConsList.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200/90 rounded-lg p-2 shadow-2xs"
            >
              <div className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                <span className="bg-blue-50 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded">
                  SP {idx + 1}
                </span>
                <span className="truncate">{item.product}</span>
              </div>

              <div className="space-y-1">
                {item.pros.map((pro, pIdx) => (
                  <div
                    key={`pro-${pIdx}`}
                    className="flex items-start gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 px-2 py-1 rounded"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">
                      <strong className="font-semibold">Ưu điểm:</strong> {pro}
                    </span>
                  </div>
                ))}

                {item.cons.map((con, cIdx) => (
                  <div
                    key={`con-${cIdx}`}
                    className="flex items-start gap-1.5 text-[11px] text-amber-900 bg-amber-50/70 px-2 py-1 rounded"
                  >
                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">
                      <strong className="font-semibold">Lưu ý:</strong> {con}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gợi ý tổng kết từ AI */}
      {data.recommendation && (
        <div className="p-2.5 bg-amber-50/90 border-t border-amber-200/70 flex items-start gap-2 text-xs text-amber-950">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold">Gợi ý từ AI: </span>
            {renderBoldMarkdown(data.recommendation)}
          </p>
        </div>
      )}
    </div>
  );
}
