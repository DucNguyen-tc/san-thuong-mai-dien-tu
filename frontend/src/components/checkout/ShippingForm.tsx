import { Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { mockProvinces, mockDistricts, mockWards } from '@/utils/mockData';
import type { CheckoutFormData } from '@/types/cart';

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên hợp lệ'),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  provinceId: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành'),
  districtId: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  wardId: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  detailAddress: z.string().min(5, 'Vui lòng nhập địa chỉ chi tiết'),
  note: z.string().optional(),
});

interface ShippingFormProps {
  onFormUpdate: (isValid: boolean, data: CheckoutFormData | null) => void;
}

export function ShippingForm({ onFormUpdate }: ShippingFormProps) {
  const {
    register,
    watch,
    formState: { errors, isValid },
    getValues,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(shippingSchema),
    mode: 'onChange',
  });

  const watchProvince = watch('provinceId');
  const watchDistrict = watch('districtId');

  // Trigger callback when form becomes valid/invalid
  useEffect(() => {
    if (isValid) {
      onFormUpdate(true, getValues());
    } else {
      onFormUpdate(false, null);
    }
  }, [isValid, getValues, watchProvince, watchDistrict, onFormUpdate]);

  return (
    <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant">
      <div className="flex items-center gap-sm mb-lg">
        <Truck className="text-primary" size={24} />
        <h2 className="font-headline-md text-headline-md">Thông tin nhận hàng</h2>
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
            className="w-full p-md border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-surface-bright"
            placeholder="Nhập số điện thoại"
          />
          {errors.phone && <p className="text-error text-sm">{errors.phone.message}</p>}
        </div>

        <div className="space-y-xs">
          <label className="text-label-md">Tỉnh/Thành *</label>
          <select
            {...register('provinceId')}
            className="w-full p-md border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-surface-bright text-body-md"
          >
            <option value="">Chọn Tỉnh/Thành</option>
            {mockProvinces.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.provinceId && <p className="text-error text-sm">{errors.provinceId.message}</p>}
        </div>

        <div className="space-y-xs">
          <label className="text-label-md">Quận/Huyện *</label>
          <select
            {...register('districtId')}
            disabled={!watchProvince}
            className="w-full p-md border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-surface-bright text-body-md disabled:opacity-50"
          >
            <option value="">Chọn Quận/Huyện</option>
            {watchProvince && mockDistricts[watchProvince]?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {errors.districtId && <p className="text-error text-sm">{errors.districtId.message}</p>}
        </div>

        <div className="space-y-xs">
          <label className="text-label-md">Phường/Xã *</label>
          <select
            {...register('wardId')}
            disabled={!watchDistrict}
            className="w-full p-md border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-surface-bright text-body-md disabled:opacity-50"
          >
            <option value="">Chọn Phường/Xã</option>
            {watchDistrict && mockWards[watchDistrict]?.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          {errors.wardId && <p className="text-error text-sm">{errors.wardId.message}</p>}
        </div>

        <div className="md:col-span-2 space-y-xs">
          <label className="text-label-md">Địa chỉ chi tiết *</label>
          <input
            {...register('detailAddress')}
            className="w-full p-md border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-surface-bright"
            placeholder="Số nhà, tên đường..."
          />
          {errors.detailAddress && <p className="text-error text-sm">{errors.detailAddress.message}</p>}
        </div>

        <div className="md:col-span-2 space-y-xs">
          <label className="text-label-md">Ghi chú (Tùy chọn)</label>
          <textarea
            {...register('note')}
            className="w-full p-md border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-surface-bright"
            placeholder="Lưu ý cho người giao hàng..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
