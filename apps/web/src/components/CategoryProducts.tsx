'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from './Card';
import { IProduct } from '@/interface/product/product.interface';
import { api } from '@/helper/api';
import { IGetCategories } from '@/interface/product/category.interface';
import { PaginationComponent } from './Pagination';
import CardSkeletonList from './skeleton/card.skeleton';

interface CategoryProductsProps {
  categoryData: IGetCategories;
}

export default function CategoryProducts({
  categoryData,
}: CategoryProductsProps) {
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const limit = 5;

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        const productsResponse = await api(
          `products?categoryId=${categoryData.id}&limit=${limit}&page=${page}`,
          'GET',
          {},
        );
        setFilteredProducts(productsResponse.data);

        const countResponse = await api(
          `products/count?categoryId=${categoryData.id}`,
          'GET',
          {},
        );
        setTotalCount(countResponse.data);
      } catch (error) {
        console.error(error);
        setFilteredProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [categoryData, page]);

  return (
    <div className="flex flex-col md:flex-row gap-8 ">
      <main className="flex-1">
        <h1 className="text-3xl font-bold mb-6">{categoryData.name}</h1>

        {isLoading ? (
          <div className="m-auto my-5 grid grid-cols-2 md:text-sm md:grid-cols-3 lg:grid-cols-5 gap-4 md:ml-10 lg:ml-0 md:mb-36">
            <CardSkeletonList />
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="m-auto my-5 grid grid-cols-2 md:text-sm md:grid-cols-3 lg:grid-cols-5 gap-4 md:ml-10 lg:ml-0 ">
              {filteredProducts.map((product) => (
                <Card product={product} key={product.id} />
              ))}
            </div>

            {totalCount > 0 && (
              <PaginationComponent
                page={page}
                setPage={setPage}
                totalCount={totalCount}
                itemsPerPage={limit}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p>No products found in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
