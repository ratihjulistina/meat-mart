'use client';
import MyCartList from '@/components/Cart/MyCartList.component';
import CheckoutProgress from '@/components/Checkout/CheckoutProgress.component';
import PaymentSummaryCart from '@/components/Checkout/PaymentSummaryCart.component';
import ChooseAddressCheckout from '@/components/ChooseAddressCheckout';
import { cartTotalPageAPI } from '@/helper/pagination/pagination.helper';
import { PageContext, RefreshContext } from '@/interface/pagination.interface';
import { updateCheckoutProgress } from '@/redux/slice/checkout.slice';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { Backdrop, Box, Button, CircularProgress } from '@mui/material';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

export default function CartPage() {
  const cartState = useAppSelector((state) => state.cartState);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const { data: session, status } = useSession();
  const [pageCount, setPageCount] = React.useState<number | undefined>();
  const [currentPage, setCurrentPage] = React.useState<number | undefined>();
  const [isRefresh, setRefresh] = React.useState(false);
  const pathname = usePathname();
  // set first page
  const params = new URLSearchParams();
  React.useEffect(() => {
    dispatch(updateCheckoutProgress('CART'));
    if (status === 'loading' || status === 'unauthenticated') {
      setLoading(true);
      return;
    }
    setLoading(true);
    // get total page
    const resTotalPage = cartTotalPageAPI(
      'cart/totalpage',
      session?.user.access_token!,
    );
    resTotalPage
      .then((v) => v.json())
      .then((value) => {
        if (currentPage && Number(value['data']['totalPage']) < currentPage) {
          console.log('less than current page', value['data']['totalPage']);

          // set first page
          params.set('page', String(value['data']['totalPage']));
          console.log('new params', params.toString());

          router.replace(`${pathname}?${params.toString()}`);
          setPageCount(value['data']['totalPage']);
          setCurrentPage(value['data']['totalPage']);
        } else if (Number(value['data']['totalPage']) !== pageCount) {
          console.log(value['data']['totalPage']);

          setPageCount(value['data']['totalPage']);
        }

        if (!currentPage) {
          setCurrentPage(1);
        }
      });
    setLoading(false);
  }, [cartState]);

  setTimeout(() => {
    return (
      <Backdrop open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }, 3000);

  if (cartState.length === 0 && !isLoading) {
    return (
      <div className="flex justify-center items-center w-full bg-[#F5F5F5]">
        <div className="flex flex-col items-center justify-center gap-10 w-4/5 max-w-[2000px] min-w-[600px] h-screen py-5 px-5 ">
          <h1 className="text-2xl">Your cart is empty</h1>
          <Button
            onClick={() => router.push('./')}
            className="!w-[300px] !bg-secondaryGreen !h-[50px] !rounded-3xl !text-white hover:"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (!isLoading) {
    return (
      <React.Fragment>
        <div className="flex justify-center items-center w-full bg-[#F5F5F5]">
          <div className="flex flex-col gap-7 w-4/5 max-w-[2000px] min-w-[600px] py-5 px-5 ">
            <div
              id="checkout-progressCont"
              className="w-full flex items-center justify-center "
            >
              <div
                id="checkout-progressItem"
                className="flex max-w-[700px] min-w-[500px] h-[50px]"
              >
                <CheckoutProgress />
              </div>
            </div>
            <div id="main-container" className="flex w-full h-[670px] gap-5 ">
              <div
                id="mycart-container"
                className="flex flex-col gap-4 w-2/3 h-full "
              >
                {/**cart item list */}
                <Box
                  id="title-container"
                  sx={{
                    width: '100%',
                    height: '100px',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: '5px',
                    backgroundColor: 'white',
                    paddingLeft: '30px',
                    paddingRight: '40px',
                  }}
                >
                  <h1 className=" text-start text-3xl font-semibold text-secondaryGreen">
                    My Cart ({cartState.length})
                  </h1>
                </Box>
                <div className="h-[650px] ">
                  <RefreshContext.Provider value={{ isRefresh, setRefresh }}>
                    <PageContext.Provider
                      value={{
                        currentPage,
                        setCurrentPage,
                        pageCount,
                        setPageCount,
                      }}
                    >
                      <MyCartList accessToken={session?.user.access_token!} />
                    </PageContext.Provider>
                  </RefreshContext.Provider>
                </div>
              </div>

              <div
                id="rightsidebar-container"
                className="w-1/3 h-full flex flex-col gap-5"
              >
                {/**right sidebar container */}

                <div className="w-full py-5 px-7 shadow-md rounded-lg bg-white ">
                  <ChooseAddressCheckout />
                </div>

                <div className="w-full py-5 px-7 shadow-md rounded-lg bg-white ">
                  <PaymentSummaryCart />
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
