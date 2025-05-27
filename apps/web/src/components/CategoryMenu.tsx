// components/SlidingCategories.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Scrollbar } from 'swiper/modules';
import type SwiperCore from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { IGetCategories } from '@/interface/product/category.interface';
import { api } from '@/helper/api';

export default function Categories() {
  const router = useRouter();
  const pathname = usePathname();
  const swiperRef = useRef<SwiperCore>();
  const [allCategories, setAllCategories] = useState<IGetCategories[]>([]);

  useEffect(() => {
    async function getAllCategories() {
      try {
        const response = await api(`category/all`, 'GET', {});
        setAllCategories(response.data);
      } catch (error) {
        console.log(error);
      }
    }
    getAllCategories();
  }, []);

  const pathParts = pathname.split('/');
  const currentCategoryId = pathParts[2] || '';

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/categories/${categoryId}`);
  };

  return (
    <div className="relative px-4 pb-6 bg-primaryBackground ">
      <div className="max-w-7xl mx-auto">
        <div className="relative px-14">
          <Swiper
            modules={[Navigation, Scrollbar]}
            spaceBetween={16}
            slidesPerView={'auto'}
            onBeforeInit={(swiper) => {
              swiperRef.current = swiper;
            }}
            breakpoints={{
              640: {
                slidesPerView: 4,
              },
              768: {
                slidesPerView: 5,
              },
              1024: {
                slidesPerView: 7,
              },
            }}
            className="!py-2"
          >
            {allCategories.map((category) => (
              <SwiperSlide key={category.id} className="!w-auto">
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex gap-2 items-center justify-center pr-6 pl-1 py-1 rounded-full transition-all duration-200 min-w-[100px]
                    ${
                      currentCategoryId === category.id
                        ? 'bg-primaryGreen text-white'
                        : 'bg-white hover:bg-primaryGreen hover:text-white'
                    }`}
                >
                  <span className="text-2xl md:text-4xl pt-2 rounded-full w-12 h-12 md:w-16 md:h-16 bg-primaryBackground">
                    <Image
                      src={
                        `/categories/${category.name.toLowerCase()}.png` ||
                        '/templateproduct.png'
                      }
                      alt={category.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover p-1 mb-1"
                    />
                  </span>
                  <span className="text-sm md:text-sm font-medium whitespace-nowrap">
                    {category.name}
                  </span>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100 focus:outline-none"
            aria-label="Previous categories"
          >
            <span className="sr-only">Previous</span>
            &lt;
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100 focus:outline-none"
            aria-label="Next categories"
          >
            <span className="sr-only">Next</span>
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
