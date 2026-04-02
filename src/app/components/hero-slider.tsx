import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

interface Slide {
  image: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

const SLIDES: Slide[] = [
  {
    image: 'https://images.unsplash.com/photo-1769147555720-71fc71bfc216?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3NwaXRhbCUyMGV4dGVyaW9yJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzcwMjE1Mjg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    heading: '24/7 Quality Healthcare You Can Trust in Birnin Kebbi',
    description: 'Compassionate medical services with on-site laboratory, imaging, and pharmacy — available every day, all day.',
    ctaText: 'Book Appointment',
    ctaLink: '/contact',
  },
  {
    image: 'https://images.unsplash.com/photo-1764885449418-db6632922a19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMGVudHJhbmNlJTIwbWVkaWNhbCUyMGNlbnRlcnxlbnwxfHx8fDE3NzAyMTUyODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    heading: 'Comprehensive Medical Services Under One Roof',
    description: 'From family medicine to surgery, pediatrics to obstetrics — complete healthcare for your entire family.',
    ctaText: 'Explore Services',
    ctaLink: '/services',
  },
  {
    image: 'https://images.unsplash.com/photo-1719934398679-d764c1410770?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3NwaXRhbCUyMGJ1aWxkaW5nfGVufDF8fHx8MTc2OTM5MjE4OHww&ixlib=rb-4.1.0&q=80&w=1080',
    heading: 'Trusted Care for Kebbi State and Beyond',
    description: 'Licensed secondary healthcare facility serving families with professional excellence and compassion.',
    ctaText: 'Contact Us',
    ctaLink: '/contact',
  },
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Images with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${SLIDES[currentSlide].image})` }}
          />
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
                {SLIDES[currentSlide].heading}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                {SLIDES[currentSlide].description}
              </p>
              <Link to={SLIDES[currentSlide].ctaLink}>
                <Button size="lg" className="hover:scale-105 transition-all shadow-lg">
                  {SLIDES[currentSlide].ctaText}
                </Button>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows - Hidden on mobile */}
      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}