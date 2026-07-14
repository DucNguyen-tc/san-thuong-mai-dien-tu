import { heroSlides } from '@/utils/mockData';

export default function HeroBanner() {
  const slide = heroSlides[0]; // MVP: hiển thị slide đầu tiên

  return (
    <section className="mt-6 relative h-[480px] rounded-xl overflow-hidden shadow-sm group">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${slide.imageUrl}')` }}
        role="img"
        aria-label={slide.title}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-10 text-white">
        <span className="text-[#fe9800] font-bold tracking-widest uppercase text-sm mb-4">
          {slide.tag}
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold max-w-[36rem] leading-tight hero-text-shadow">
          {slide.title}
        </h1>
        <p className="mt-4 text-base lg:text-lg max-w-[32rem] opacity-90 leading-relaxed">
          {slide.subtitle}
        </p>
        <div className="mt-8">
          <button className="bg-[#fe9800] text-white px-8 py-3 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg">
            {slide.ctaText}
          </button>
        </div>
      </div>

      {/* Slide indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <div className="w-10 h-1 bg-white rounded-full" />
        <div className="w-10 h-1 bg-white/30 rounded-full" />
        <div className="w-10 h-1 bg-white/30 rounded-full" />
      </div>
    </section>
  );
}
