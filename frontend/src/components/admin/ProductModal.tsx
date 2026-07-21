import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { getCategoryTree } from '@/services/categoryService';
import { uploadImage } from '@/services/uploadService';
import { createProduct, updateProduct } from '@/services/productService';
import type { Category, CatalogProduct } from '@/types/catalog';
import { getPrimaryImageUrl } from '@/types/catalog';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: CatalogProduct | null;
}

export default function ProductModal({ isOpen, onClose, onSuccess, editingProduct }: ProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    image_url: '',
  });
  
  const [variants, setVariants] = useState<{ id?: string, attributes: Record<string, string>, price: number, stock_quantity: number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setFormData({
          name: editingProduct.name,
          description: editingProduct.description || '',
          category_id: editingProduct.category_id,
          image_url: getPrimaryImageUrl(editingProduct) || '',
        });
        
        if (editingProduct.variants && editingProduct.variants.length > 0) {
          setVariants(editingProduct.variants.map(v => ({
            id: v.id,
            attributes: (v.attributes || {}) as Record<string, string>,
            price: Number(v.price),
            stock_quantity: v.stock_quantity
          })));
        } else {
          setVariants([{ attributes: {}, price: 0, stock_quantity: 0 }]);
        }
      } else {
        setFormData({ name: '', description: '', category_id: '', image_url: '' });
        setVariants([{ attributes: {}, price: 0, stock_quantity: 0 }]);
      }
      getCategoryTree().then(setCategories).catch(() => {});
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (err) {
      alert('Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { attributes: {}, price: 0, stock_quantity: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };
  
  const updateVariantAttribute = (index: number, key: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index].attributes = { ...newVariants[index].attributes, [key]: value };
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        variants: variants,
        images: formData.image_url ? [{ url: formData.image_url, is_primary: true, sort_order: 1 }] : [],
      };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi hệ thống. Vui lòng kiểm tra lại thông tin.';
      alert(`Thất bại: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
              <input 
                required 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select 
                required
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn danh mục...</option>
                {categories.map(cat => (
                  <optgroup key={cat.id} label={cat.name}>
                    <option value={cat.id}>{cat.name}</option>
                    {cat.children?.map(child => (
                      <option key={child.id} value={child.id}>-- {child.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Danh sách biến thể (Màu, Size...)</label>
                <button type="button" onClick={handleAddVariant} className="text-sm text-blue-600 flex items-center hover:underline">
                  Thêm biến thể
                </button>
              </div>
              <div className="space-y-3">
                {variants.map((v, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 relative">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Màu sắc (VD: Đen)</label>
                          <input 
                            type="text"
                            value={v.attributes.color || v.attributes.name || ''}
                            onChange={(e) => updateVariantAttribute(index, 'color', e.target.value)}
                            placeholder="Trống nếu k có"
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Size/Dung lượng</label>
                          <input 
                            type="text"
                            value={v.attributes.size || ''}
                            onChange={(e) => updateVariantAttribute(index, 'size', e.target.value)}
                            placeholder="Trống nếu k có"
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Giá (VNĐ)</label>
                          <input type="number" required min={0} value={v.price} onChange={e => updateVariant(index, 'price', Number(e.target.value))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tồn kho</label>
                          <input type="number" required min={0} value={v.stock_quantity} onChange={e => updateVariant(index, 'stock_quantity', Number(e.target.value))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                      </div>
                    </div>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => handleRemoveVariant(index)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
                {formData.image_url ? (
                  <div className="relative">
                    <img src={formData.image_url} alt="Preview" className="h-32 object-contain" />
                    <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={14}/></button>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-400 mb-2" size={24} />
                    <label className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500">
                      <span>Tải ảnh lên</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP lên đến 5MB</p>
                    {uploading && <p className="text-xs text-blue-500 mt-2 flex items-center"><Loader2 size={12} className="animate-spin mr-1"/> Đang tải lên...</p>}
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả <span className="text-red-500">*</span></label>
              <textarea 
                required
                rows={3} 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
            Hủy
          </button>
          <button 
            type="submit" 
            form="productForm" 
            disabled={isSubmitting || uploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
            Lưu sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
}
