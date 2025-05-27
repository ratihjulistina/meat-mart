'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ICard } from '../interface/product/card.interface';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import { IGetProductPictures } from '@/interface/product/productPictures.interface';
import { api } from '@/helper/api';
import { Plus } from 'lucide-react';
import {
  addToCartAPI,
  getCartDataAPI,
  indexProductInCart,
  isMaxAddedToCart,
  syncCartDataFromAPI,
} from '@/helper/cart/cart.helper';
import { callToast } from '@/helper/notify.helper';
import { updateCartState } from '@/redux/slice/cart.slice';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { IProduct } from '@/interface/product/product.interface';

export function Card({ product }: { product: IProduct }) {
  // global state
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const cartState = useAppSelector((state) => state.cartState);

  // local state
  const [isMaxAdded, setMaxAdded] = useState<boolean>();
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!session) {
      setOpenSnackbar(true);
      return;
    }

    // call api first
    const resAddCart = await addToCartAPI(
      'cart/add',
      {
        quantity: 1,
        productId: product.id,
      },
      session.user.access_token!,
    );

    if (resAddCart.status !== 200) {
      callToast('Something went wrong, try again later', 'ERROR', 3000);
      return;
    }

    // get latest cart
    const resGetCart = await getCartDataAPI(
      'cart/get',
      session.user.access_token!,
    );
    if (resGetCart.status !== 200) {
      callToast('Something went wrong, try again later', 'ERROR', 3000);
      return;
    }

    // sync to local state
    const updatedCart = syncCartDataFromAPI((await resGetCart.json())['data']);
    dispatch(updateCartState(updatedCart));

    const index = indexProductInCart(cartState, product);
    setMaxAdded(isMaxAddedToCart(cartState[index], product));
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={handleCloseSnackbar}
          sx={{ width: '100%' }}
        >
          Silahkan Masuk untuk menambahkan produk ke keranjang!
        </Alert>
      </Snackbar>

      <Link href={`/products/${product.id}`} passHref>
        <div className="w-full max-w-[230px] bg-primaryIcon rounded-lg shadow-xl relative">
          {product.finalPrice && (
            <div className="absolute -top-2 -left-2 bg-red-500 rounded-md z-10 min-w-[50px] px-2 pt-1.5 min-h-[30px]">
              <div className="flex items-center gap-2 z-30 ">
                {product.Discounts?.map((discount, index) =>
                  discount.promotion_type ? (
                    <p key={index} className="text-white text-sm font-bold">
                      {discount.promotion_type}
                    </p>
                  ) : null,
                )}
              </div>
            </div>
          )}
          <div className="w-full">
            <div className="w-full px-2 py-2 rounded-xl">
              <div className="relative">
                <img
                  width={216}
                  height={100}
                  className="w-full rounded-lg h-[150px] lg:h-[150px] object-cover"
                  src={product.image || '/templateproduct.png'}
                  alt="product-image"
                />
                {product.finalPrice ? (
                  <>
                    {' '}
                    {product.availableStocks.length !== 0 ? (
                      <Image
                        width={60}
                        height={60}
                        alt=""
                        className={`w-[45px] h-[45px] absolute right-[15%] top-[10%] 
                    ${product.availableStocks[0].stores.status === 'BRANCH' && product.availableStocks[0].quantity === 0 ? 'block' : 'hidden'}`}
                        src="/sold-icon.png"
                      />
                    ) : (
                      <>
                        <Image
                          width={60}
                          height={60}
                          alt=""
                          className={`w-[45px] h-[45px] absolute right-[15%] top-[10%] 
                    `}
                          src="/sold-icon.png"
                        />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {' '}
                    {product.availableStocks.length !== 0 ? (
                      <Image
                        width={60}
                        height={60}
                        alt=""
                        className={`w-[45px] h-[45px] absolute right-[15%] top-[10%] 
                    ${product.availableStocks[0].stores.status === 'BRANCH' && product.availableStocks[0].quantity === 0 ? 'block' : 'hidden'}`}
                        src="/sold-icon.png"
                      />
                    ) : (
                      <>
                        <Image
                          width={60}
                          height={60}
                          alt=""
                          className={`w-[45px] h-[45px] absolute right-[15%] top-[10%] 
                    `}
                          src="/sold-icon.png"
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="px-2 md:px-5 mt-4 flex flex-col text-sm md:text-[16px]">
              <b className="h-4 md:h-6 w-full">{product.name}</b>
              <p className="mt-1 md:mt-0 h-4 md:h-6 mb-2 w-full overflow-hidden text-xs md:text-sm text-gray-500">
                {product.weight}g
              </p>

              {product.finalPrice ? (
                <>
                  <div className="flex justify-between items-center mb-4 md:mb-4">
                    {' '}
                    <b className="text-[#159953] overflow-hidden">IDR </b>
                    <b className="text-primaryText overflow-hidden">
                      <s>
                        {` ${Number(product.price).toLocaleString('id-ID')}`}
                      </s>
                    </b>
                    <b className="text-[#159953] overflow-hidden">
                      {` ${Number(product.finalPrice).toLocaleString('id-ID')}`}
                    </b>
                    <>
                      <button
                        onClick={handleAddToCart}
                        className={`h-8 w-8 md:h-8 md:w-8 font-semibold rounded-full text-xl md:text-2xl flex items-center justify-center
                    ${
                      product.availableStocks.length === 0 ||
                      product.availableStocks[0].quantity === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-orangeAccent hover:text-white hover:bg-orange-600'
                    }`}
                      >
                        <Plus size={18} />
                      </button>
                    </>
                    {/* ) : (
                      <button
                        onClick={handleAddToCart}
                        className="h-8 w-8 md:h-8 md:w-8 font-semibold rounded-full text-xl md:text-2xl flex items-center justify-center
                   
                        bg-gray-400 cursor-not-allowed"
                      >
                        <Plus size={18} />
                      </button>
                    )} */}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 md:mb-4">
                    {' '}
                    <b className="text-[#159953] overflow-hidden">
                      {product.price == 0
                        ? 'Free'
                        : `IDR ${Number(product.price).toLocaleString('id-ID')}`}
                    </b>
                    <button
                      onClick={handleAddToCart}
                      className={`h-8 w-8 md:h-8 md:w-8 font-semibold rounded-full text-xl md:text-2xl flex items-center justify-center
                    ${
                      product.availableStocks.length === 0 ||
                      // product.availableStocks[0].stores.status === 'CENTRAL' ||
                      product.availableStocks[0].quantity === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-orangeAccent hover:text-white hover:bg-orange-600'
                    }`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
