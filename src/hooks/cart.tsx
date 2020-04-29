import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem('@GoMarketplace:cart');

      !!cartProducts && setProducts(JSON.parse(cartProducts));
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProduct = products.findIndex(product => product.id === id);

      if (newProduct >= 0) {
        const updatedProducts = [...products];

        updatedProducts[newProduct].quantity += 1;

        setProducts(updatedProducts);
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProductIndex = products.findIndex(product => product.id === id);

      if (newProductIndex >= 0) {
        if (products[newProductIndex].quantity > 1) {
          const updatedProducts = [...products];

          updatedProducts[newProductIndex].quantity -= 1;

          setProducts([...updatedProducts]);
        } else {
          const updatedProducts = products.filter(product => product.id !== id);

          setProducts([...updatedProducts]);
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productExistsOnCart = products.findIndex(
        cartProduct => cartProduct.id === product.id,
      );

      if (productExistsOnCart < 0) {
        setProducts(oldProducts => [
          ...oldProducts,
          { ...product, quantity: 1 },
        ]);
        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
