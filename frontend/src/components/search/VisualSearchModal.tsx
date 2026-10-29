import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  UploadCloud,
  Sparkles,
  Link as LinkIcon,
  RotateCcw,
  AlertCircle,
  Camera,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  visualSearch,
  type VisualSearchResultItem,
} from '@/services/searchService';
import { formatPrice } from '@/utils/formatters';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VisualSearchModal({
  isOpen,
  onClose,
}: VisualSearchModalProps) {
  const navigate = useNavigate();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VisualSearchResultItem[]>([]);
  const [searchTimeMs, setSearchTimeMs] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setIsDragging(false);
      setIsSearching(false);
      setResults([]);
      setError(null);
      setUrlInput('');
      setShowUrlInput(false);
    }
  }, [isOpen]);

  // Execute Visual Search
  const executeSearch = useCallback(async (input: File | string) => {
    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const response = await visualSearch(input, 12);
      setResults(response.items || []);
      setSearchTimeMs(response.processing_time_ms || 0);
    } catch (err: any) {
      console.error('Lỗi Visual Search:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tìm kiếm bằng hình ảnh này. Vui lòng thử ảnh khác.';
      setError(msg);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle selected file
  const handleFile = useCallback(
    (file: File) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError('Định dạng file không hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WebP.');
        return;
      }

      // Validate size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      executeSearch(file);
    },
    [executeSearch],
  );

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Clipboard Paste (Ctrl + V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (isSearching) return;

      // 1. Kiểm tra nếu paste file ảnh
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          handleFile(file);
          return;
        }
      }

      // 2. Kiểm tra nếu paste link URL ảnh
      const text = e.clipboardData?.getData('text')?.trim();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        if (/\.(jpg|jpeg|png|webp|avif)($|\?)/i.test(text)) {
          e.preventDefault();
          setPreviewUrl(text);
          executeSearch(text);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, isSearching, handleFile, executeSearch]);

  // Handle Search with Image URL
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setPreviewUrl(trimmed);
    executeSearch(trimmed);
  };

  // Reset to upload state
  const handleReset = () => {
    setPreviewUrl(null);
    setResults([]);
    setError(null);
    setUrlInput('');
    setIsSearching(false);
  };

  // Navigate to product detail
  const handleProductClick = (productId: string) => {
    onClose();
    navigate(`/products/${productId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Laser Scanning Animation CSS */}
      <style>{`
        @keyframes visualLaserScan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 96%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
        .laser-beam {
          animation: visualLaserScan 2s ease-in-out infinite;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        ref={modalContentRef}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                Tìm kiếm bằng hình ảnh
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={11} /> AI CLIP
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Tìm các sản phẩm có kiểu dáng, màu sắc tương đồng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TRƯỜNG HỢP 1: Chưa chọn ảnh - Hiển thị Dropzone */}
          {!previewUrl && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/70 bg-slate-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} />
                </div>

                <h4 className="text-base font-semibold text-slate-800 mb-1">
                  Kéo thả ảnh vào đây, hoặc{' '}
                  <span className="text-blue-600 underline underline-offset-2">
                    chọn từ máy tính
                  </span>
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Hỗ trợ JPG, PNG, WebP (tối đa 5MB). Bạn cũng có thể nhấn{' '}
                  <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-200 text-slate-700 rounded-md">
                    Ctrl + V
                  </kbd>{' '}
                  để dán ảnh đã sao chép.
                </p>
              </div>

              {/* Tùy chọn nhập URL ảnh */}
              <div className="pt-2 text-center">
                {!showUrlInput ? (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    <LinkIcon size={14} />
                    Hoặc dán liên kết (URL) hình ảnh
                  </button>
                ) : (
                  <form
                    onSubmit={handleUrlSubmit}
                    className="flex items-center gap-2 max-w-md mx-auto animate-in fade-in duration-200"
                  >
                    <div className="relative flex-1">
                      <LinkIcon
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="url"
                        placeholder="Dán link ảnh (https://...)"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!urlInput.trim()}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                    >
                      Tìm ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                    >
                      <X size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: Đã có ảnh - Đang phân tích (Scanning state) */}
          {previewUrl && isSearching && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              {/* Preview with Cyber Laser Scan */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-xl bg-slate-900 group">
                <img
                  src={previewUrl}
                  alt="Search query preview"
                  className="w-full h-full object-cover opacity-85"
                />

                {/* Laser beam */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] laser-beam" />

                {/* Scan Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
              </div>

              <div className="text-center space-y-1.5 animate-pulse">
                <p className="text-sm font-semibold text-slate-800 flex items-center justify-center gap-2">
                  <Sparkles size={16} className="text-blue-600 animate-spin" />
                  Đang phân tích đặc trưng thị giác bằng CLIP AI...
                </p>
                <p className="text-xs text-slate-500">
                  So khớp vector 512 chiều với toàn bộ kho sản phẩm
                </p>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 3: Có kết quả hoặc Lỗi */}
          {previewUrl && !isSearching && (
            <div className="space-y-6">
              {/* Bar điều khiển phía trên kết quả */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white shadow-xs">
                    <img
                      src={previewUrl}
                      alt="Query"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Ảnh bạn đang tìm kiếm
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tìm thấy {results.length} sản phẩm tương tự ({searchTimeMs}ms)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw size={13} />
                  Thử ảnh khác
                </button>
              </div>

              {/* Hiển thị lỗi nếu có */}
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">Đã xảy ra lỗi khi tìm kiếm</p>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Lưới sản phẩm tương tự */}
              {results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {results.map((product) => {
                    const pct = product.similarity_percent;
                    // Phân loại màu badge theo % similarity
                    let badgeClass = 'bg-emerald-600 text-white';
                    let badgeText = `${pct}% Rất giống`;

                    if (pct < 75) {
                      badgeClass = 'bg-violet-600 text-white';
                      badgeText = `${pct}% Phong cách`;
                    } else if (pct < 90) {
                      badgeClass = 'bg-blue-600 text-white';
                      badgeText = `${pct}% Tương đồng`;
                    }

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="group bg-white rounded-2xl border border-slate-100 hover:border-blue-400 p-2.5 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          {/* Ảnh sản phẩm + Badge Similarity */}
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-2.5 border border-slate-100">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {/* Similarity Pill Badge */}
                            <span
                              className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 ${badgeClass}`}
                            >
                              <Sparkles size={10} />
                              {badgeText}
                            </span>

                            {product.has_discount && (
                              <span className="absolute bottom-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500 text-white shadow-xs">
                                -{product.discount_percent}%
                              </span>
                            )}
                          </div>

                          {/* Tên sản phẩm */}
                          <h5 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors mb-1.5">
                            {product.name}
                          </h5>
                        </div>

                        {/* Giá tiền */}
                        <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                            <ArrowRight size={14} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !error && (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Layers size={26} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">
                        Chưa tìm thấy sản phẩm tương tự
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Thử chọn một góc chụp khác rõ nét hơn hoặc thử tìm kiếm một bức ảnh sản phẩm khác.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Thử ảnh khác
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
