import type { Category, HeroSlide, Product } from '@/types/product';

// ============================================================
// Mock Data — Trang Chủ V-Shop
// Dữ liệu giả lập — sẽ được thay thế bằng API calls sau
// ============================================================

export const heroSlides: HeroSlide[] = [
  {
    id: 'slide-1',
    tag: 'Tech Revolution 2024',
    title: 'Đỉnh Cao Công Nghệ, Ưu Đãi Chạm Đáy',
    subtitle: 'Sắm ngay các thiết bị công nghệ mới nhất với mức giá giảm đến 30% trong tuần lễ hội V-Shop.',
    ctaText: 'Mua Ngay',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6Wh9djTdISuN-3WmqifIrhGQiwmeRRIS2gNNNLkKtxf2B-_llZqAlgP0Imj1e3nyPg20mwkjuP_kWI3JHVZvEll9p24BjFCjzJQmiFR3IrfVXUNNxkMZaMbuhaIwcG6fUXxarfgFjVFhpiplFR_a-Jmb88ESq_QvKdov9CgVwV3-EorHBQ7pfYH6Nl0FHU_1q6lno5frhz5ZZKkVAGUf6TTqOuO3naIFhrNq1cB416zVoK22_h44Y3Qv_aLWWQ4tBtXvNGYA79kop',
  },
];

export const categories: Category[] = [
  { id: 'cat-phone', name: 'Điện thoại', icon: 'Smartphone', href: '/products?category=phone' },
  { id: 'cat-laptop', name: 'Laptop', icon: 'Laptop', href: '/products?category=laptop' },
  { id: 'cat-fashion', name: 'Thời trang', icon: 'Shirt', href: '/products?category=fashion' },
  { id: 'cat-watch', name: 'Đồng hồ', icon: 'Watch', href: '/products?category=watch' },
  { id: 'cat-audio', name: 'Phụ kiện', icon: 'Headphones', href: '/products?category=audio' },
  { id: 'cat-home', name: 'Gia dụng', icon: 'Home', href: '/products?category=home' },
  { id: 'cat-beauty', name: 'Làm đẹp', icon: 'Sparkles', href: '/products?category=beauty' },
  { id: 'cat-toys', name: 'Đồ chơi', icon: 'Gamepad2', href: '/products?category=toys' },
];

export const aiRecommendations: Product[] = [
  {
    id: 'ai-1',
    name: 'Tai Nghe Không Dây Sony WH-1000XM5',
    brand: 'Sony',
    price: 6490000,
    rating: 4.9,
    reviewCount: 1200,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDh9WeE3sBB1CoG3VfuO00Lm1dT8XBXt6N8T2pXcvRwlR-Qin1rTQaU6G8ZBDnYFneInSAn54vAmswhjyBJ6WYANj98M3ECKsmua73qP9J5Em6hV2j6gH1jBJPVklr4wzeeuuQbVwRdIf7jTcmA4-0xqSc_jSXdXt2LbMk59-4xS44lnZoqHJa_ewb65bMkYZiEsMOLKN_YQ9bAqJekRuy2RbB-J0kwQjN_lc_rJho0-RvANRbtdo4LG0Y2LiiCUa-aj1ewBP0x6Ka3',
    badge: 'new',
    badgeLabel: 'Mới ra mắt',
    aiReason: 'Dựa trên tìm kiếm của bạn',
  },
  {
    id: 'ai-2',
    name: 'Túi Xách Da Thật Classic Edition',
    brand: 'V-Style',
    price: 2850000,
    rating: 4.8,
    reviewCount: 850,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUC_XrC-xhSX8tLyi8DpBJKqSk2x-tJFcrdAGjwvs43gLa5hLRucvbUN9c3hYxohMAVlG8PBMj70O4xjNLy47MelEUUmYwyGk5VzN_pop6h-q7Rjk5fdgdLneHOuOyP1qBAHY1jOMVdfL2mA-dNKeXGkxoJJotKEy8vf4UJiSr5rAkMzn7eImxZx9PSxHQSsLaLIePSIQp1vtxYjQb5Ntq_Z8sWm7DK5MpyCdgjwa-t5e7qz_wMvFwXzPkUOURh8bn0N5BceaWInQH',
    badge: 'bestseller',
    badgeLabel: 'Bán chạy',
    aiReason: 'Phù hợp phong cách của bạn',
  },
  {
    id: 'ai-3',
    name: 'Bộ Điều Khiển Nhà Thông Minh V-Home',
    brand: 'V-Home',
    price: 1200000,
    rating: 4.7,
    reviewCount: 420,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDnWvcRWkPer3oyhWtJNxfDxFa3kFvWZA6HSG5_6KhBx8bILv5wUp0j2X5353FeNQG1AEzQxhUxNCezj7MoYmqMc3kZzdHyCy4HDeSDbpUmARU-uL5OHuoIUCavuj6QtFXXORUaZfqNc8kCxx106Ho_y0Jo-RZGO60P3vw2Jrz66zQrRALzMKuFVQk_7IXaJ9-RTNNlQ32HsHr9sSGrHNhuwmI-ihmwIYS1Tl6DGG4WTAEHqZID590gaAKSD2sVaycWDEnJogpeRmj',
    badge: 'hot',
    badgeLabel: 'Hot Deal',
    aiReason: 'Sản phẩm bạn có thể thích',
  },
];

export const bestSellers: Product[] = [
  {
    id: 'bs-1',
    name: 'Samsung Galaxy S24 Ultra Titanium Gray',
    brand: 'Samsung',
    price: 26990000,
    rating: 4.9,
    reviewCount: 2100,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC-fSzasaKStffBF1mmvnFZ4DWTipexARLpmWTuJDzpGDpLvjmLs22XNtekORxk3Rr_9Ytvk3wGCtAHTbcnACXyjFM1Nb40CT8EHk61rMAJwsKb5ESpfedlrGTWKixW03p4ygcwfUgtQTdtiLXk5Zk4zRTvMLr0TIHch44yPrP7rEX4YIuw-HjPn_Rh3-DHqyyt0ivNhwwtbhPLieK1c7la2qtIYLCqrS_l7iDsIMOBL1bB8s9m9kPJFnEGp4XJWkO6qTRWvRGCiOXP',
    badge: 'discount',
    badgeLabel: 'GIẢM 20%',
  },
  {
    id: 'bs-2',
    name: 'Giày Sneakers Nam V-Light Pro White',
    brand: 'V-Style',
    price: 1450000,
    rating: 4.7,
    reviewCount: 890,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAo-qLlispSP2a6amZ-I9FQvYTuX8--WE8Vt-vPax_U-M3XHVHiKXk18aE4JDH2SRqYboxMW0egcFHILTDO9u6k6EryWhbqWVyM56vUxkOklmD9r9ggvtWK3Qrfj5st83wA6RSq8m_yh4Hja3BFmQgoT5z04QX8oedouPcvuVpZvyya-QEr9yfPUe-pJ3YtBC79aTTtWs4zDdw9RHepzFq5TFq1_xg9Hzv0s8ddkyNZwYHrgLZ3c5jyp4eo1tAKBZ6LjD8BLdZmw7JC',
  },
  {
    id: 'bs-3',
    name: 'MacBook Air 13-inch M3 Chip 2024',
    brand: 'Apple',
    price: 27490000,
    rating: 5.0,
    reviewCount: 540,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD-VRLVLQxrpqFAXjhYwTGwaRlER6FBE6sGqf3rDm3K5zXkNav87Lh8G0t-UMxNA0LM9t6kJjMrU8j9dxPflCKLdYaCu5SG0QZkSgpxkwMcQckajqBFK5tlQAgZyNe6KqpN624UHoYDSEmfO1HWOU4tBbIlI2hES6OC3lXeCvHtbaTpgEKK3oG_raUNX1qnpT4f8q8idku7hmZVkSmfPM6t-WfofSwG7VxBuJaeOQpNyunQ72i8sVG3L-WOLPBukwed8PZ2sNPr3wPf',
    badge: 'gift',
    badgeLabel: 'QUÀ TẶNG',
  },
  {
    id: 'bs-4',
    name: 'Nồi Chiên Không Dầu Smart 6.5L',
    brand: 'KitchenPro',
    price: 3200000,
    rating: 4.8,
    reviewCount: 1200,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKB-yo9oOBi1gK8ZiGXGxT5PCz2ldGb7RNsC62-xMxvJS6FDwB3Kdl4kPD3yPxfsKW05CHKfk6VgkYq8czqETsRORF_4jj5XtfudNh9AVif_CBuqgpGMvwAO9yYw6Su0zDJXMsZl7Z45a4LJlaJEEl-jStSbxkDo7qvvbjj3yqgN0Vtue12IRTpgWZFogDmGEyVo99HHfWOGK09Ww7BTsiDOpMUgoRPKProx1fvqDLZRvBDEEU3ubcic2MnW5OKSBHWlunm8Q_asqJ',
  },
  {
    id: 'bs-5',
    name: 'Bàn Phím Cơ Gaming RGB Pro X',
    brand: 'Razer',
    price: 2150000,
    rating: 4.6,
    reviewCount: 320,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAXM5xiy0E5X-nU3eOnDkuq0l79ciziuMQDKAKDABRVNY_kG7sKzaZkBxNy7cOLZ-qJiVmSmO949S1M3srmoG46e1nGwmpaET5MGVYPy1Ei64FC2z5aYohTqUo6YBd16xnZ5Fv44BX6LdJ0KAKO9spK2Sq0IFCHe4acEwuwRshh4fVUOajfcCECXnVA43CWSx9aJeZ8_pnCsTslerFcBsmyeHboeBRoaz6lHhbmimWD6XgSMniWFz9LS3BLcbH0gkMH15kQKB8gHLMm',
  },
];
