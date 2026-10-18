/**
 * Mock product database simulating an external persistent store / microservice
 */
const PRODUCTS = [
  { id: '1', name: 'Mechanical Keyboard', category: 'Electronics', price: 99.99, stock: 45 },
  { id: '2', name: 'Wireless Ergonomic Mouse', category: 'Electronics', price: 49.99, stock: 120 },
  { id: '3', name: '4K Ultra HD Monitor', category: 'Displays', price: 349.99, stock: 18 },
  { id: '4', name: 'Noise-Cancelling Headphones', category: 'Audio', price: 199.99, stock: 60 },
  { id: '5', name: 'USB-C Multiport Hub', category: 'Accessories', price: 39.99, stock: 200 },
  { id: '6', name: 'Desk LED Lamp', category: 'Office', price: 29.99, stock: 75 },
  { id: '7', name: 'Aluminium Laptop Stand', category: 'Office', price: 34.99, stock: 110 },
  { id: '8', name: 'Webcam 1080p 60fps', category: 'Video', price: 79.99, stock: 35 },
];

/**
 * Fetch a product by ID with a simulated database delay (e.g. 100ms)
 * to demonstrate latency differences between cache HIT vs MISS.
 *
 * @param {string} id
 * @param {number} simulatedDelayMs
 * @returns {Promise<object|null>}
 */
export async function getProductById(id, simulatedDelayMs = 120) {
  if (simulatedDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs));
  }

  const product = PRODUCTS.find((p) => p.id === String(id));
  if (!product) {
    return null;
  }

  return {
    ...product,
    fetchedAt: new Date().toISOString(),
    source: 'simulated-database',
  };
}

/**
 * List all available demo products
 */
export function getAllDemoProducts() {
  return PRODUCTS.map(({ id, name, category, price }) => ({ id, name, category, price }));
}

