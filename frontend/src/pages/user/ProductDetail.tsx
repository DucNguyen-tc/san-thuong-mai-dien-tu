import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  Star,
  ChevronRight,
  ChevronLeft,
  Truck,
  ShieldCheck,
  RefreshCcw,
  CreditCard,
  Loader2,
} from "lucide-react";
import { getProductById } from "@/services/productService";
import type { CatalogProduct } from "@/types/catalog";
import { getDisplayPrice, getPrimaryImageUrl } from "@/types/catalog";
import { formatPrice } from "@/utils/formatters";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import SimilarProducts from "@/components/SimilarProducts";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("desc");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );

  const { addItem, isLoading: isAddingToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isCancelled = false;
    setIsLoading(true);

    getProductById(id)
      .then((data) => {
        if (!isCancelled) {
          setProduct(data);
          if (data.variants && data.variants.length > 0) {
            const activeVariants = data.variants.filter((v) => v.is_active);
            if (activeVariants.length > 0)
              setSelectedVariantId(activeVariants[0].id);
            else setSelectedVariantId(data.variants[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-gray-500">
        Không tìm thấy sản phẩm
      </div>
    );
  }

  const primaryImage =
    getPrimaryImageUrl(product) || "https://via.placeholder.com/600";

  const selectedVariant = product.variants?.find(
    (v) => v.id === selectedVariantId,
  );
  const currentPrice = selectedVariant
    ? Number(selectedVariant.price)
    : getDisplayPrice(product);
  const availableStock = selectedVariant
    ? selectedVariant.stock_quantity - selectedVariant.stock_reserved
    : 0;
  const isOutOfStock = availableStock <= 0;

  const activeVariants = product.variants?.filter((v) => v.is_active) || [];
  const hasColor = activeVariants.some((v) => v.attributes?.color);
  const hasSize = activeVariants.some((v) => v.attributes?.size);
  const colors = Array.from(
    new Set(activeVariants.map((v) => v.attributes?.color).filter(Boolean)),
  );
  const sizes = Array.from(
    new Set(activeVariants.map((v) => v.attributes?.size).filter(Boolean)),
  );

  const handleSelectColor = (color: string) => {
    const currentSize = selectedVariant?.attributes?.size;
    let target = activeVariants.find(
      (v) =>
        v.attributes?.color === color && v.attributes?.size === currentSize,
    );
    if (!target)
      target = activeVariants.find((v) => v.attributes?.color === color);
    if (target) setSelectedVariantId(target.id);
  };

  const handleSelectSize = (size: string) => {
    const currentColor = selectedVariant?.attributes?.color;
    let target = activeVariants.find(
      (v) =>
        v.attributes?.size === size && v.attributes?.color === currentColor,
    );
    if (!target)
      target = activeVariants.find((v) => v.attributes?.size === size);
    if (target) setSelectedVariantId(target.id);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!selectedVariantId || !product.id) return;

    try {
      await addItem(product.id, selectedVariantId, 1, {
        name: product.name,
        price: currentPrice,
        attributes: selectedVariant?.attributes || {},
        image_url: primaryImage,
      });

      setToastMessage("Thêm vào giỏ hàng thành công!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      setToastMessage("Lỗi khi thêm vào giỏ hàng. Vui lòng thử lại!");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!selectedVariantId || !product.id) return;

    try {
      await addItem(product.id, selectedVariantId, 1, {
        name: product.name,
        price: currentPrice,
        attributes: selectedVariant?.attributes || {},
        image_url: primaryImage,
      });

      // Lấy danh sách item mới nhất để tìm cart_item_id vừa tạo
      const latestItems = useCartStore.getState().items;
      const addedItem = latestItems.find((item) => item.variant_id === selectedVariantId);

      if (addedItem) {
        navigate("/checkout", { state: { selectedIds: [addedItem.id] } });
      } else {
        navigate("/checkout");
      }
    } catch (error) {
      setToastMessage("Lỗi khi xử lý Mua ngay. Vui lòng thử lại!");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <Link to="/products" className="hover:text-gray-900">
            {product.category?.name || "Danh mục"}
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        {/* Product Top */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row gap-10">
          {/* Left: Images */}
          <div className="w-full md:w-[45%] flex-shrink-0">
            <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 border border-gray-100">
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
              <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                -20%
              </div>
              <button className="absolute top-4 right-4 w-10 h-10 bg-white shadow rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Heart size={20} />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {[
                primaryImage,
                "https://via.placeholder.com/150/e0e0e0",
                "https://via.placeholder.com/150/d0d0d0",
                "https://via.placeholder.com/150/c0c0c0",
              ].map((img, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-lg border-2 overflow-hidden cursor-pointer ${idx === 0 ? "border-blue-600" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="aspect-square rounded-lg border-2 border-gray-200 relative overflow-hidden cursor-pointer group">
                <img
                  src={primaryImage}
                  className="w-full h-full object-cover blur-[2px]"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white font-medium group-hover:bg-black/30">
                  +3
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex-1 flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 uppercase text-blue-600 tracking-wide text-xs">
              V-SHOP EXCLUSIVE
            </h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {product.name}
            </h2>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className={
                      s <= 4
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
                <span className="text-sm text-gray-600 ml-1">
                  4.8 (124 đánh giá)
                </span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              {isOutOfStock ? (
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-sm uppercase tracking-wide">
                  Hết hàng
                </span>
              ) : (
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-sm uppercase tracking-wide">
                  Còn hàng ({availableStock})
                </span>
              )}
            </div>

            <div className="flex items-end gap-3 mb-6">
              <span className="text-3xl font-bold text-blue-600">
                {formatPrice(currentPrice)}
              </span>
              <span className="text-lg text-gray-400 line-through mb-1">
                {formatPrice(currentPrice * 1.25)}
              </span>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-6 mb-8">
                {hasColor && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Màu sắc:{" "}
                      <span className="font-normal text-gray-600">
                        {selectedVariant?.attributes?.color}
                      </span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleSelectColor(color)}
                          className={`px-6 py-2 rounded border font-medium text-sm transition-colors ${
                            selectedVariant?.attributes?.color === color
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:border-gray-400 text-gray-700"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {hasSize && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Dung lượng / Size:{" "}
                      <span className="font-normal text-gray-600">
                        {selectedVariant?.attributes?.size}
                      </span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => handleSelectSize(size)}
                          className={`px-6 py-2 rounded border font-medium text-sm transition-colors ${
                            selectedVariant?.attributes?.size === size
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:border-gray-400 text-gray-700"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Fallback for old 1D variants */}
                {!hasColor && !hasSize && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Tùy chọn:{" "}
                      <span className="font-normal text-gray-600">
                        {selectedVariant?.attributes?.name ||
                          selectedVariant?.attributes?.default ||
                          "Mặc định"}
                      </span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      {product.variants
                        .filter((v) => v.is_active)
                        .map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`px-6 py-2 rounded border font-medium text-sm transition-colors ${
                              selectedVariantId === v.id
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-gray-300 hover:border-gray-400 text-gray-700"
                            }`}
                          >
                            {v.attributes?.name ||
                              v.attributes?.default ||
                              "Mặc định"}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="py-3 bg-[#ff9900] hover:bg-[#e68a00] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Mua Ngay
              </button>
              <button
                disabled={isOutOfStock || isAddingToCart}
                onClick={handleAddToCart}
                className="py-3 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed font-bold rounded-lg transition-colors flex items-center justify-center gap-2 relative overflow-hidden"
              >
                {isAddingToCart ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <ShoppingCart size={18} /> Thêm vào giỏ
                  </>
                )}
              </button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-blue-600" /> Miễn phí giao hàng
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" /> Bảo hành 24
                tháng
              </div>
              <div className="flex items-center gap-2">
                <RefreshCcw size={18} className="text-blue-600" /> 7 ngày đổi
                trả
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-blue-600" /> Trả góp 0%
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("desc")}
              className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "desc" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Mô tả sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("spec")}
              className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "spec" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Thông số kỹ thuật
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "review" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Đánh giá khách hàng (124)
            </button>
          </div>

          <div className="p-8">
            {activeTab === "desc" && (
              <div className="prose max-w-none text-gray-600 text-sm leading-relaxed">
                <p className="mb-6 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
            {activeTab === "spec" && (
              <div className="text-sm text-gray-600">Nội dung thông số...</div>
            )}
            {activeTab === "review" && (
              <div className="text-sm text-gray-600">Nội dung đánh giá...</div>
            )}
          </div>
        </div>

        {/* Similar Products (AI Recommended) */}
        {id && <SimilarProducts productId={id} />}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          {toastMessage.includes("thành công") ? (
            <ShoppingCart size={16} className="text-green-400" />
          ) : null}
          {toastMessage}
        </div>
      )}
    </div>
  );
}
