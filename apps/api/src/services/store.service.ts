import { statusEnum } from '@/enums/statusEnum.enums';
import { getCoordinates } from '@/helper/geocode';
import { Request } from 'express';
import { serviceFeedback } from '@/interface/serviceFeedback.interface';
import prisma from '@/prisma';
import { getStoreById, getSuperAdminByEmail } from '@/helper/store.prisma';

class StoreService {
  async getList(req: Request) {
    const { email } = req.query;
    console.log('INSIDE SERVICE', email);
    try {
      const superAdmin = await getSuperAdminByEmail(email as string);
      if (!superAdmin) {
        throw new Error('Super Admin not found');
      }
      const countStore = await prisma.stores.count({});
      if (countStore === 0) {
        return {
          code: 200,
          data: countStore,
          status: statusEnum.SUCCESS,
          message: 'There is no store yet!',
        };
      }
      const stores = await prisma.stores.findMany({
        where: { deleted_at: null },
        include: {
          storeadmin: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return {
        code: 200,
        data: stores,
        status: statusEnum.SUCCESS,
        message: 'Successfully fetched all stores',
      };
    } catch (error) {
      console.error('Fetching stores error:', error);
      throw new Error('Error during fetching stores');
    }
  }

  async createStore(req: Request) {
    const { store, email } = req.body;

    try {
      const superAdmin = await getSuperAdminByEmail(email);

      if (!superAdmin) {
        throw new Error('Super Admin not found');
      }

      const fullAddress = `${store.address}, ${store.district}, ${store.city}, ${store.province}, ${store.postal_code}, Indonesia`;

      const coordinates = await getCoordinates(fullAddress);
      // console.log(
      //   'CORDINATE TOKO======================================',
      //   coordinates,
      // );
      if (!coordinates) {
        throw new Error('Could not geocode the provided address');
      }

      const adminId = store.storeadmin_id || superAdmin.id;

      const newStore = await prisma.stores.create({
        data: {
          name: store.name,
          address: store.address,
          province: store.province,
          city: store.city,
          district: store.district,
          postal_code: store.postal_code.toString(),
          status: store.status,
          latitude: coordinates?.lat.toString() || '',
          longitude: coordinates?.lng.toString() || '',
          storeadmin: {
            connect: {
              id: adminId,
            },
          },
        },
        include: {
          storeadmin: true,
        },
      });

      const allProducts = await prisma.products.findMany();

      const stockData = allProducts.map((product) => {
        return {
          product_id: product.id,
          store_id: newStore.id,
          quantity: 0,
          deleted_at: product.deleted_at ? product.deleted_at : null,
        };
      });

      await prisma.stocks.createMany({
        data: stockData,
      });

      console.log('LATLONG', newStore);
      return {
        code: 200,
        data: newStore,
        status: statusEnum.SUCCESS,
        message: 'Successfully add new store',
      };
    } catch (error) {
      console.error('Creating new store error:', error);
      throw new Error('Error during creating new store');
    }
  }

  async getStoreById(req: Request) {
    const { email, id } = req.body;
    console.log('INSIDE SERVICE', id);

    const superAdmin = await getSuperAdminByEmail(email);

    if (!superAdmin) {
      throw new Error('Super Admin not found');
    }

    try {
      const store = await prisma.stores.findUnique({
        where: { id: id as string },
        include: {
          storeadmin: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });
      if (!store) {
        throw new Error('Store not found');
      }
      return {
        code: 200,
        data: store,
        status: statusEnum.SUCCESS,
        message: 'Successfully fetch data store',
      };
    } catch (error) {
      console.error('Fetching store error:', error);
      throw new Error('Error during fetching data store');
    }
  }

  async updateStoreById(req: Request) {
    const { id } = req.params;
    const { email, store } = req.body;

    try {
      const superAdmin = await getSuperAdminByEmail(email);
      if (!superAdmin) {
        throw new Error('Super Admin not found');
      }

      const fullAddress = `${store.address}, ${store.district}, ${store.city}, ${store.province}, ${store.postal_code}, Indonesia`;

      const coordinates = await getCoordinates(fullAddress);
      // console.log(
      //   'CORDINATE TOKO======================================',
      //   coordinates,
      // );
      if (!coordinates) {
        throw new Error('Could not geocode the provided address');
      }
      const adminId = store.storeadmin_id || superAdmin.id;

      const updatedStore = await prisma.stores.update({
        where: { id: id as string },
        data: {
          name: store.name,
          address: store.address,
          province: store.province,
          city: store.city,
          district: store.district,
          postal_code: store.postal_code.toString(),
          status: store.status,
          latitude: coordinates?.lat.toString() || '',
          longitude: coordinates?.lng.toString() || '',
          storeadmin: {
            connect: {
              id: adminId,
            },
          },
        },
        include: {
          storeadmin: true,
        },
      });
      return {
        code: 200,
        data: updatedStore,
        status: statusEnum.SUCCESS,
        message: 'Successfully update address',
      };
    } catch (error) {
      console.error('Updating address error:', error);
      throw new Error('Error during updating address');
    }
  }
  async deleteStoreById(req: Request) {
    const { id } = req.params;
    const { email } = req.body;

    const superAdmin = await getSuperAdminByEmail(email);
    if (!superAdmin)
      return {
        code: 401,
        data: null,
        status: statusEnum.FAILED,
        message: 'Super Admin not found',
      };
    console.log('DELETE SERVICE', id, email);
    const deletedstore = await prisma.stores.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    const remainingStore = await prisma.stores.findMany({
      where: { deleted_at: null },
    });

    await prisma.stocks.updateMany({
      where: { store_id: req.params.id },
      data: { deleted_at: new Date() },
    });

    return {
      code: 200,
      data: remainingStore,
      status: statusEnum.SUCCESS,
      message: 'successfull delete store',
    };
  }

  async getListStoreByProvince(req: Request) {
    const { email, store } = req.body;

    try {
      const superAdmin = await getSuperAdminByEmail(email as string);
      if (!superAdmin) {
        throw new Error('Super Admin not found');
      }
      const countStore = await prisma.stores.count({
        where: { province: store.province, deleted_at: null },
      });
      if (countStore === 0) {
        return {
          code: 200,
          data: countStore,
          status: statusEnum.SUCCESS,
          message: 'There is no store yet!',
        };
      }
      const stores = await prisma.stores.findMany({
        where: { province: store.province, deleted_at: null },
        include: {
          storeadmin: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return {
        code: 200,
        data: stores,
        status: statusEnum.SUCCESS,
        message: 'Successfully fetched all stores by province',
      };
    } catch (error) {
      console.error('Fetching stores error:', error);
      throw new Error('Error during fetching stores');
    }
  }

  async getAllStores(req: Request) {
    let allStores;
    if (req.query.includeDeleted === 'true') {
      if (req.query.storeAdminId) {
        allStores = await prisma.stores.findMany({
          where: { storeadmin_id: req.query.storeAdminId as string },
        });
      } else {
        allStores = await prisma.stores.findMany();
      }
    } else {
      if (req.query.storeAdminId) {
        allStores = await prisma.stores.findMany({
          where: {
            storeadmin_id: req.query.storeAdminId as string,
            deleted_at: null,
          },
        });
      } else {
        allStores = await prisma.stores.findMany({
          where: {
            deleted_at: null,
          },
        });
      }
    }

    const feedback: serviceFeedback = {
      code: 200,
      data: allStores,
      status: statusEnum.SUCCESS,
      message: req.query.storeAdminId
        ? `Successfully fetched all stores with storeadmin_id ${req.query.storeAdminId}.`
        : `Successfully fetched all stores.`,
    };
    return feedback;
  }

  async getStore(req: Request) {
    if (!req.query.id) {
      const feedback: serviceFeedback = {
        code: 400,
        data: null,
        status: statusEnum.FAILED,
        message: `ID is required to fetch store.`,
      };
      return feedback;
    }

    const store = await getStoreById(req.query.id as string);

    if (
      (store && store.deleted_at && req.query.includeDeleted !== 'true') ||
      !store
    ) {
      const feedback: serviceFeedback = {
        code: 404,
        data: null,
        status: statusEnum.FAILED,
        message: `Store with ID ${req.query.id} does not exist.`,
      };
      return feedback;
    }

    const feedback: serviceFeedback = {
      code: 200,
      data: store,
      status: statusEnum.SUCCESS,
      message: `Successfully fetched store with ID ${req.query.id}.`,
    };
    return feedback;
  }
}

export default new StoreService();
