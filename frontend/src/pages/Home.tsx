import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  // Sample products
  const featuredProducts = [
    {
      id: '1',
      name: 'Áo thun nam Polo cao cấp',
      price: 250000,
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      category: 'Thời trang nam',
    },
    {
      id: '2',
      name: 'Điện thoại iPhone 15 Pro Max',
      price: 29990000,
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      category: 'Điện tử',
    },
    {
      id: '3',
      name: 'Giày sneaker thể thao năng động',
      price: 1200000,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      category: 'Giày dép',
    },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden py-24 px-6 sm:px-12 lg:px-24">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
        <div className="relative max-w-[56rem] mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Mua sắm thông minh cùng <span className="text-primary-400">SanThuongMai</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-[42rem] mx-auto">
            Khám phá hàng ngàn sản phẩm chất lượng vượt trội từ thời trang, điện tử đến đồ gia dụng với giá cả tốt nhất thị trường.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Mua ngay
            </Link>
            <a
              href="#featured"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-300 hover:text-white hover:border-white transition"
            >
              Tìm hiểu thêm
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="max-w-[80rem] mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Sản phẩm nổi bật</h2>
            <p className="mt-2 text-sm text-gray-500">Những sản phẩm được yêu thích và bán chạy nhất tuần này.</p>
          </div>
          <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
            Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <div key={product.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-lg transition">
              <div className="aspect-[4/3] bg-gray-200 group-hover:opacity-75 transition overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">
                  {product.category}
                </span>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  <Link to={`/products/${product.id}`} className="hover:text-primary-600">
                    {product.name}
                  </Link>
                </h3>
                <div className="flex flex-1 items-end justify-between">
                  <p className="text-lg font-bold text-red-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                  </p>
                  <button className="rounded bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition">
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
