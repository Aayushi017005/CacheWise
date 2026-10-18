import { Router } from 'express';
import { getProduct, listDemoProducts } from '../controllers/demoController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

export const demoRouter = Router();

// Products endpoint cached transparently via cacheMiddleware
demoRouter.get('/products', cacheMiddleware, listDemoProducts);
demoRouter.get('/products/:id', cacheMiddleware, getProduct);

