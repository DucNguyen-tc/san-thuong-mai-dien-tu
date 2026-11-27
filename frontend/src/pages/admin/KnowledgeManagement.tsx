import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Sparkles,
  Loader2,
  Eye,
  Power,
  X,
  FileText,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  getKnowledgeDocuments,
  createKnowledgeDocument,
  updateKnowledgeDocument,
  toggleKnowledgeDocument,
  deleteKnowledgeDocument,
  testRagQuery,
  type KnowledgeDocument,
  type KnowledgeSourceType,
  type RagQueryChunk,
} from '@/services/ragService';

const SOURCE_TYPE_META: Record<
  KnowledgeSourceType,
  { label: string; badgeClass: string }
> = {
  POLICY: { label: 'Chính sách (POLICY)', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  FAQ: { label: 'Hỏi đáp (FAQ)', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  SHIPPING: { label: 'Vận chuyển (SHIPPING)', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  WARRANTY: { label: 'Bảo hành (WARRANTY)', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const SOURCE_OPTIONS: KnowledgeSourceType[] = ['POLICY', 'FAQ', 'SHIPPING', 'WARRANTY'];

export default function KnowledgeManagement() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | KnowledgeSourceType>('ALL');

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<KnowledgeDocument | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    sourceType: KnowledgeSourceType;
    originalContent: string;
  }>({
    title: '',
    sourceType: 'POLICY',
    originalContent: '',
  });

  // RAG Query Tester state
  const [ragTestInput, setRagTestInput] = useState('');
  const [ragTestResults, setRagTestResults] = useState<RagQueryChunk[] | null>(null);
  const [isTestingRag, setIsTestingRag] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await getKnowledgeDocuments();
      setDocuments(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách tài liệu RAG');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesType = filterType === 'ALL' || doc.sourceType === filterType;
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.originalContent.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [documents, searchTerm, filterType]);

  const totalChunks = useMemo(
    () => documents.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0),
    [documents]
  );

  const estimatedWordCount = useMemo(
    () => formData.originalContent.trim().split(/\s+/).filter(Boolean).length,
    [formData.originalContent]
  );

  const openCreateModal = () => {
    setEditingDoc(null);
    setFormData({
      title: '',
      sourceType: 'POLICY',
      originalContent: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doc: KnowledgeDocument) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      sourceType: doc.sourceType,
      originalContent: doc.originalContent,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim().length < 3) {
      toast.error('Tiêu đề phải có ít nhất 3 ký tự');
      return;
    }
    if (formData.originalContent.trim().length < 10) {
      toast.error('Nội dung chính sách phải có ít nhất 10 ký tự');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDoc) {
        await updateKnowledgeDocument(editingDoc.id, formData);
        toast.success('Đã cập nhật chính sách & đồng bộ lại vector RAG!');
      } else {
        await createKnowledgeDocument(formData);
        toast.success('Đã thêm chính sách & huấn luyện vector RAG thành công!');
      }
      setIsModalOpen(false);
      await fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu tài liệu RAG');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (doc: KnowledgeDocument) => {
    try {
      const updated = await toggleKnowledgeDocument(doc.id);
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
      toast.success(updated.isActive ? 'Đã bật tài liệu trong RAG' : 'Đã tạm tắt tài liệu khỏi RAG');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đổi trạng thái');
    }
  };

  const handleDelete = async (doc: KnowledgeDocument) => {
    const confirm = await Swal.fire({
      title: 'Xóa tài liệu chính sách?',
      text: `"${doc.title}" và toàn bộ ${doc.chunkCount} vector chunks liên quan sẽ bị xóa khỏi kho tri thức AI.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa tài liệu',
      cancelButtonText: 'Hủy',
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteKnowledgeDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success('Đã xóa tài liệu khỏi kho tri thức AI');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài liệu');
    }
  };

  const handleTestRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragTestInput.trim()) return;
    setIsTestingRag(true);
    try {
      const chunks = await testRagQuery(ragTestInput.trim(), 3, 0.3);
      setRagTestResults(chunks);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể kiểm tra truy vấn RAG');
    } finally {
      setIsTestingRag(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2.5">
            <BookOpen className="text-primary" size={26} />
            Kho Tri Thức AI (RAG Policies)
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Quản lý chính sách, quy định & FAQ để Trợ lý AI và CSKH Copilot trả lời chính xác theo thời gian thực.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={18} />
          Thêm chính sách mới
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Tổng số tài liệu</p>
            <p className="text-xl font-bold text-on-surface">{documents.length}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Power size={20} />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Đang kích hoạt</p>
            <p className="text-xl font-bold text-on-surface">
              {documents.filter((d) => d.isActive).length}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Vector Chunks (pgvector)</p>
            <p className="text-xl font-bold text-on-surface">{totalChunks}</p>
          </div>
        </div>
      </div>

      {/* RAG Live Query Tester */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
          <Sparkles size={16} className="text-primary" />
          Kiểm tra truy vấn RAG trực tiếp (Semantic Search)
        </div>
        <form onSubmit={handleTestRag} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={ragTestInput}
            onChange={(e) => setRagTestInput(e.target.value)}
            placeholder="Nhập thử câu hỏi của khách hàng (VD: Có hỗ trợ thanh toán VNPay không? Phí ship bao nhiêu?)..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={isTestingRag || !ragTestInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {isTestingRag ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Kiểm tra
          </button>
        </form>

        {ragTestResults !== null && (
          <div className="pt-2 space-y-2">
            {ragTestResults.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Không tìm thấy đoạn chính sách nào đạt ngưỡng tương đồng cho câu hỏi này.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ragTestResults.map((chunk) => (
                  <div
                    key={chunk.chunk_id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 truncate">{chunk.document_title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        {(chunk.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-4 leading-relaxed">{chunk.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters & Documents List */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tiêu đề hoặc nội dung chính sách..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(['ALL', ...SOURCE_OPTIONS] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterType === type
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {type === 'ALL' ? 'Tất cả' : type}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
            <Loader2 size={28} className="animate-spin text-primary" />
            <span className="text-sm">Đang tải kho tri thức AI...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant text-sm">
            Chưa có tài liệu nào phù hợp.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {filteredDocuments.map((doc) => {
              const meta = SOURCE_TYPE_META[doc.sourceType] || SOURCE_TYPE_META.POLICY;
              return (
                <div
                  key={doc.id}
                  className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors ${
                    !doc.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}
                      >
                        {doc.sourceType}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {doc.chunkCount} chunks
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          doc.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {doc.isActive ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-on-surface">{doc.title}</h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {doc.originalContent}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Cập nhật: {new Date(doc.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface-variant cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleToggle(doc)}
                      className={`p-2 rounded-lg border border-outline-variant cursor-pointer ${
                        doc.isActive
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={doc.isActive ? 'Tạm tắt' : 'Kích hoạt lại'}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => openEditModal(doc)}
                      className="p-2 rounded-lg border border-outline-variant hover:bg-blue-50 text-blue-600 cursor-pointer"
                      title="Chỉnh sửa & Re-train vector"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-2 rounded-lg border border-outline-variant hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Xóa tài liệu"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingDoc ? 'Cập nhật chính sách RAG' : 'Thêm chính sách mới cho AI'}
              </h2>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tiêu đề chính sách *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Chính sách đổi trả hàng"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Phân loại (Source Type) *
                </label>
                <select
                  value={formData.sourceType}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceType: e.target.value as KnowledgeSourceType })
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {SOURCE_TYPE_META[opt].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Nội dung chi tiết *
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {estimatedWordCount} từ (~{Math.max(1, Math.ceil(estimatedWordCount / 250))} chunks)
                  </span>
                </div>
                <textarea
                  required
                  rows={9}
                  value={formData.originalContent}
                  onChange={(e) => setFormData({ ...formData, originalContent: e.target.value })}
                  placeholder="Nhập rõ ràng từng điều khoản (VD: Điều 1: ..., Điều 2: ...) để AI trích xuất chính xác..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Khi lưu, hệ thống sẽ tự động chia nhỏ nội dung và tính toán lại vector embedding trong pgvector.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting
                    ? 'Đang tạo vector RAG...'
                    : editingDoc
                    ? 'Lưu & Cập nhật Vector'
                    : 'Thêm & Huấn luyện AI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Detail */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                    (SOURCE_TYPE_META[viewingDoc.sourceType] || SOURCE_TYPE_META.POLICY).badgeClass
                  }`}
                >
                  {viewingDoc.sourceType}
                </span>
                <h2 className="text-lg font-bold text-gray-900 truncate">{viewingDoc.title}</h2>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {viewingDoc.originalContent}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>Số vector chunks: {viewingDoc.chunkCount}</span>
              <button
                onClick={() => {
                  const target = viewingDoc;
                  setViewingDoc(null);
                  openEditModal(target);
                }}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Chỉnh sửa tài liệu này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

