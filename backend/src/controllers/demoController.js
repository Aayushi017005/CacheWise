import { getProductById, getAllDemoProducts } from '../services/demoDataService.js';

export async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    // Allow custom simulated delay via query param e.g. ?delay=150
    const delayMs = req.query.delay !== undefined ? parseInt(req.query.delay, 10) : 120;

    const product = await getProductById(id, delayMs);

    if (!product) {
      return res.status(404).json({
        error: `Product with ID "${id}" was not found.`,
        availableIds: ['1', '2', '3', '4', '5', '6', '7', '8'],
      });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
}

export function listDemoProducts(req, res) {
  const products = getAllDemoProducts();
  res.json({
    count: products.length,
    products,
  });
}

