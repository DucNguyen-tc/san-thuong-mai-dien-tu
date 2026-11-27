import { Bot, Camera, Sparkles, Zap, ArrowRight, Scan, ShieldCheck } from 'lucide-react';

export default function AIFeaturesBanner() {
  const handleOpenAIChat = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
  };

  const handleOpenVisualSearch = () => {
    window.dispatchEvent(new CustomEvent('open-visual-search'));
  };

  return (
    <section className="mt-14 relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-7 md:p-10 shadow-2xl border border-indigo-500/20">
      {/* Decorative background lights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Tag & Title */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Đột Phá Công Nghệ Mua Sắm Thế Hệ Mới
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
          Trải Nghiệm Mua Sắm Thông Minh Cùng{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
            AI Độc Quyền V-Shop
          </span>
        </h2>
        <p className="mt-2 text-sm md:text-base text-gray-300">
          Tối ưu hóa hành trình mua hàng với Trợ lý tư vấn thời gian thực và Tìm kiếm đa phương thức bằng hình ảnh thông minh.
        </p>
      </div>

      {/* 2 Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Card 1: AI Chat Shopping Assistant */}
        <div className="group bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:border-indigo-400/40 hover:-translate-y-1">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Live SSE 24/7
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
              Trợ Lý Mua Sắm AI Cá Nhân Hóa
            </h3>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-6">
              Tư vấn chọn sản phẩm theo đúng tầm giá, so sánh cấu hình trực quan 2-4 thiết bị và giải đáp chính sách bảo hành, đổi trả 24/7 theo thời gian thực.
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-indigo-200">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Nhận diện ý định và lọc sản phẩm trong 1 chạm</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tự động tạo Ticket CSKH khi khách hàng có khiếu nại</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenAIChat}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <span>Trò chuyện cùng Trợ Lý AI</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Card 2: AI Visual Search */}
        <div className="group bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:border-teal-400/40 hover:-translate-y-1">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                Vector 1536D
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
              Tìm Kiếm Thông Minh Bằng Hình Ảnh
            </h3>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-6">
              Bạn thấy một sản phẩm ưng ý ngoài đời hay trên mạng? Chỉ cần chụp ảnh hoặc upload ảnh lên, AI sẽ đối chiếu không gian vector và tìm sản phẩm tương tự trong 0.2s.
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-teal-200">
                <Scan className="w-3.5 h-3.5 text-teal-300" />
                <span>Nhận diện kiểu dáng, màu sắc và thương hiệu tự động</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-teal-200">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Tích hợp Elasticsearch Multimodal Embedding siêu tốc</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenVisualSearch}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-teal-600/30 transition-all cursor-pointer"
          >
            <span>Thử Visual Search (Chụp / Tải ảnh) 📸</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}

