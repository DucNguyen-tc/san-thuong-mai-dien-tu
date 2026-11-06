import { Sparkles } from 'lucide-react';
import type { ComparisonTableMetadata } from '@/types/aiChat';

interface ChatComparisonTableProps {
  data: ComparisonTableMetadata;
}

export default function ChatComparisonTable({ data }: ChatComparisonTableProps) {
  if (!data || !Array.isArray(data.products) || data.products.length === 0) {
    return null;
  }

  return (
    <div className="mt-2.5 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-blue-50/80 border-b border-gray-200">
              <th className="py-2 px-2.5 font-semibold text-gray-700 w-24 shrink-0">
                Tiêu chí
              </th>
              {data.products.map((prodName, idx) => (
                <th
                  key={idx}
                  className="py-2 px-2.5 font-bold text-primary min-w-[110px]"
                >
                  {prodName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.attributes?.map((attr, rowIdx) => (
              <tr
                key={rowIdx}
                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              >
                <td className="py-1.5 px-2.5 font-medium text-gray-600">
                  {attr.name}
                </td>
                {attr.values.map((val, colIdx) => (
                  <td key={colIdx} className="py-1.5 px-2.5 text-gray-800">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.recommendation && (
        <div className="p-2.5 bg-amber-50/80 border-t border-amber-100 flex items-start gap-2 text-xs text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold">Gợi ý từ AI: </span>
            {data.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
