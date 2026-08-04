import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import { getSimilarProductIds } from "@/services/recommendationService";
import { recordProductView } from "@/services/userBehaviorService";
import type { CatalogProduct } from "@/types/catalog";
import {
  getDisplayPrice,
  getMaxDiscountTag,
  getPrimaryImageUrl,
} from "@/types/catalog";
import { formatPrice } from "@/utils/formatters";
import { useCartStore } from "@/store/useCartStore";
import toast from "react-hot-toast";
import CatalogProductCard from "@/components/product/CatalogProductCard";


export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimilarLoading, setIsSimilarLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("desc");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState<number>(1);

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
          // Ghi lại hành vi xem sản phẩm vào localStorage để cá nhân hóa trang chủ
          recordProductView(
            data.id,
            data.category_id,
            data.category?.name ?? ''
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    // Lấy sản phẩm tương tự bằng AI recommendation
    setIsSimilarLoading(true);
    getSimilarProductIds(id, 6)
      .then(async (similarIds) => {
        if (isCancelled) return;
        const promises = similarIds
          .filter((sId) => sId !== id)
          .slice(0, 4)
          .map((sId) => getProductById(sId).catch(() => null));
        const results = await Promise.all(promises);
        const valid = results.filter((p): p is CatalogProduct => p !== null);
        if (!isCancelled) {
          setSimilarProducts(valid);
        }
      })
      .catch((err) => console.error('[ProductDetail] Failed to load similar products:', err))
      .finally(() => {
        if (!isCancelled) setIsSimilarLoading(false);
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
  const basePrice = selectedVariant
    ? Number(selectedVariant.price)
    : getDisplayPrice(product);

  let currentPrice = basePrice;
  if (product.promotions && product.promotions.length > 0) {
    let bestPrice = basePrice;
    for (const item of product.promotions) {
      const promo = item.promotion;
      if (promo.discount_type === "PERCENT") {
        const p = basePrice * (1 - Number(promo.discount_value) / 100);
        if (p < bestPrice) bestPrice = p;
      } else {
        const p = basePrice - Number(promo.discount_value);
        if (p < bestPrice) bestPrice = p;
      }
    }
    currentPrice = Math.max(0, bestPrice);
  }
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

  const handleAddToCart = async (showToastMessage = true) => {
    if (!product) return false;
    if (product.variants && product.variants.length > 0 && !selectedVariantId) {
      toast.error("Vui lòng chọn phân loại sản phẩm");
      return false;
    }
    const variantId = selectedVariantId || "";
    try {
      const localMeta = {
        name: product.name,
        price: currentPrice,
        attributes: selectedVariant?.attributes || {},
        image_url: primaryImage,
      };
      await addItem(product.id, variantId, quantity, localMeta);
      if (showToastMessage) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng!");
      }
      return true;
    } catch (err) {
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
      return false;
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (product.variants && product.variants.length > 0 && !selectedVariantId) {
      toast.error("Vui lòng chọn phân loại sản phẩm");
      return;
    }
    const variantId = selectedVariantId || "";
    try {
      const localMeta = {
        name: product.name,
        price: currentPrice,
        attributes: selectedVariant?.attributes || {},
        image_url: primaryImage,
      };
      await addItem(product.id, variantId, quantity, localMeta);
      
      const currentCartItems = useCartStore.getState().items;
      const addedItem = currentCartItems.find(
        (item) => item.product_id === product.id && item.variant_id === variantId
      );

      if (addedItem) {
        navigate("/checkout", { state: { selectedIds: [addedItem.id] } });
      } else {
        navigate("/checkout");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi xử lý mua ngay");
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
              {getMaxDiscountTag(product) && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {getMaxDiscountTag(product)}
                </div>
              )}
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
              {currentPrice < basePrice && (
                <span className="text-lg text-gray-400 line-through mb-1">
                  {formatPrice(basePrice)}
                </span>
              )}
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

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-900">Số lượng:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 disabled:text-gray-300 transition-colors font-semibold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, availableStock)}
                  disabled={isOutOfStock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      setQuantity(Math.max(1, Math.min(availableStock, val)));
                    }
                  }}
                  className="w-12 text-center border-none focus:outline-none focus:ring-0 text-sm font-medium disabled:bg-gray-50"
                />
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setQuantity((prev) => Math.min(availableStock, prev + 1))}
                  className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 disabled:text-gray-300 transition-colors font-semibold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="py-3 bg-[#ff9900] hover:bg-[#e68a00] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-sm"
              >
                Mua Ngay
              </button>
              <button
                disabled={isOutOfStock}
                onClick={() => handleAddToCart(true)}
                className="py-3 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} /> Thêm vào giỏ
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

        {/* Similar Products */}
        <div className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Sản phẩm tương tự{" "}
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2 relative -top-1">
                GỢI Ý
              </span>
            </h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                <ChevronLeft size={20} />
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          {isSimilarLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : similarProducts.length > 0 ? (
            <div className="grid grid-cols-4 gap-5">
              {similarProducts.map((sp) => (
                <CatalogProductCard key={sp.id} product={sp} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">Chưa có sản phẩm tương tự.</p>
          )}
        </div>
      </div>
    </div>
  );
}
