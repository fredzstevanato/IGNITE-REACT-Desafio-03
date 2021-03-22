import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

interface VerififyProduct {
  isPossible: boolean,
  message: string;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExistsInCart = cart.find(product => product.id === productId)

      if(productExistsInCart) {
        const { data: stock } = await api.get<Stock>(`stock/${productId}`)

        const totalProduct = productExistsInCart.amount + 1;

        if( (totalProduct) > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
  
        const updatedProductInCart = cart.map(cartItem => cartItem.id === productId ? {
           ...cartItem,
            amount: totalProduct
          }: cartItem)
          
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProductInCart))
          setCart(updatedProductInCart)

          return
      } 

      const { data: product } = await api.get<Product>(`products/${productId}`);
      
      const newCart = ([...cart, {
        ...product,
        amount: 1
      }])
      
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.some(product => product.id === productId)
      
      if (productExists) {
        const cartUpdated = cart.filter(cartItem => cartItem.id !== productId)
        setCart(cartUpdated)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))
        return
      }

      toast.error('Erro na remoção do produto')

    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        toast.error('Erro na alteração de quantidade do produto');
        return
      }

      const {data: stock} = await api.get<Stock>(`/stock/${productId}`);

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const updatedCart = cart.map(cartItem => cartItem.id === productId ? {
        ...cartItem,
        amount: amount
      } : cartItem)
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
