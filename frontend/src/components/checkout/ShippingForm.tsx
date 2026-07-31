import { Truck, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { CheckoutFormData } from '@/types/cart';

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên hợp lệ'),
  phone: z.string(),
  detailAddress: z.string().min(5, 'Vui lòng nhập địa chỉ chi tiết'),
  addressId: z.string().optional(),
});

interface Address {
  id: string;
  receiver_name: string | null;
  phone: string | null;
  address_line: string;
  is_default: boolean;
}

interface ShippingFormProps {
  onFormUpdate: (isValid: boolean, data: CheckoutFormData | null) => void;
}

export function ShippingForm({ onFormUpdate }: ShippingFormProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    formState: { errors, isValid, isDirty },
    getValues,
    setValue,
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(shippingSchema),
    mode: 'onChange',
  });

  const watchValues = watch();
  const watchValuesString = JSON.stringify(watchValues);
  const currentAddressId = watch('addressId');

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      const data: Address[] = res.data.data || [];
      setAddresses(data);
      
      // If we don't have an address currently selected, pick default
      if (data.length > 0 && !getValues('addressId')) {
        const defaultAddr = data.find(a => a.is_default) || data[0];
        applyAddressToForm(defaultAddr);
      }
    } catch (err) {
      console.error('Lỗi khi tải địa chỉ:', err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (isValid) {
      onFormUpdate(true, getValues());
    } else {
      onFormUpdate(false, null);
    }
  }, [isValid, watchValuesString, onFormUpdate, getValues]);

  const applyAddressToForm = (addr: Address) => {
    setValue('fullName', addr.receiver_name || '', { shouldValidate: true, shouldDirty: false });
    setValue('phone', addr.phone || '', { shouldValidate: true, shouldDirty: false });
    setValue('detailAddress', addr.address_line || '', { shouldValidate: true, shouldDirty: false });
    setValue('addressId', addr.id, { shouldValidate: true });
    setShowAddressModal(false);
  };

  const handleSaveAddress = async () => {
    if (!isValid) return;
    
    setIsSaving(true);
    const formData = getValues();
    const payload = {
      receiver_name: formData.fullName,
      phone: formData.phone,
      address_line: formData.detailAddress,
    };

    try {
      if (currentAddressId) {
        // Cập nhật địa chỉ hiện tại
        await api.put(`/addresses/${currentAddressId}`, payload);
        setToastMessage('Cập nhật địa chỉ thành công!');
      } else {
        // Tạo địa chỉ mới
        const res = await api.post('/addresses', payload);
        const newAddr = res.data.data;
        setValue('addressId', newAddr.id); // set id so next save is update
        setToastMessage('Thêm địa chỉ mới thành công!');
      }
      // Tải lại danh sách để đồng bộ
      await fetchAddresses();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setToastMessage('Có lỗi xảy ra khi lưu địa chỉ.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant">
      <div className="flex items-center justify-between mb-lg">
        <div className="flex items-center gap-sm">
          <Truck className="text-primary" size={24} />
          <h2 className="font-headline-md text-headline-md">Thông tin nhận hàng</h2>
        </div>
        {addresses.length > 0 && (
          <button 
            onClick={() => setShowAddressModal(true)}
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <MapPin size={16} />
            Chọn địa chỉ khác
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <div className="space-y-xs">
          <label className="text-label-md">Họ và tên *</label>
          <input
            {...register('fullName')}
            className="w-full p-md border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-surface-bright"
            placeholder="Nhập tên người nhận"
          />
          {errors.fullName && <p className="text-error text-sm">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-xs">
          <label className="text-label-md">Số điện thoại *</label>
          <input
            {...register('phone')}
            type="tel"
            readOnly
            className="w-full p-md border border-outline-variant rounded-lg bg-surface-container focus:outline-none text-on-surface-variant cursor-not-allowed"
            placeholder="Số điện thoại"
          />
          {errors.phone && <p className="text-error text-sm">{errors.phone.message}</p>}
        </div>

        <div className="md:col-span-2 space-y-xs">
          <label className="text-label-md">Địa chỉ chi tiết *</label>
          <input
            {...register('detailAddress')}
            className="w-full p-md border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-surface-bright"
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
          />
          {errors.detailAddress && <p className="text-error text-sm">{errors.detailAddress.message}</p>}
        </div>

        <div className="md:col-span-2 flex justify-end mt-2">
          <button
            onClick={handleSaveAddress}
            disabled={!isValid || isSaving || (!isDirty && !!currentAddressId)}
            className="px-6 py-2 bg-primary text-on-primary rounded-lg font-medium text-sm hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Đang lưu...' : (currentAddressId ? 'Cập nhật địa chỉ này' : 'Lưu làm địa chỉ mới')}
          </button>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h2 className="text-xl font-semibold text-on-surface">Chọn địa chỉ giao hàng</h2>
              <button onClick={() => setShowAddressModal(false)} className="text-outline hover:text-on-surface">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              {addresses.map(addr => (
                <div 
                  key={addr.id}
                  onClick={() => applyAddressToForm(addr)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    currentAddressId === addr.id 
                      ? 'border-primary bg-primary-fixed/30' 
                      : 'border-outline-variant hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className={currentAddressId === addr.id ? "text-primary" : "text-outline"} size={20} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-on-surface">{addr.receiver_name || 'Không tên'}</h3>
                        <span className="text-outline">|</span>
                        <span className="text-sm text-on-surface-variant">{addr.phone || 'Chưa có SĐT'}</span>
                        {addr.is_default && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-primary bg-primary-fixed rounded-full border border-primary/20">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant">{addr.address_line}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => {
                  setValue('fullName', '');
                  setValue('phone', '');
                  setValue('detailAddress', '');
                  setValue('addressId', '');
                  setShowAddressModal(false);
                }}
                className="w-full py-3 border border-dashed border-primary text-primary rounded-xl font-medium hover:bg-primary-fixed/20 transition-colors"
              >
                + Thêm địa chỉ mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
