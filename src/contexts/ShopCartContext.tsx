import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock: number;
}

export interface CartItem extends ShopProduct {
  quantity: number;
}

interface ShopCartContextValue {
  items: CartItem[];
  tenantId: string | null;
  totalQty: number;
  totalPrice: number;
  addItem: (product: ShopProduct, tenantId: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
}

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

export const ShopCartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const addItem = useCallback((product: ShopProduct, tId: string, qty = 1) => {
    setItems((prev) => {
      // si cambia el tenant, vaciamos el carrito
      if (tenantId && tenantId !== tId) {
        setTenantId(tId);
        return [{ ...product, quantity: Math.min(qty, product.stock) }];
      }
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.stock);
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: newQty } : i));
      }
      return [...prev, { ...product, quantity: Math.min(qty, product.stock) }];
    });
    if (!tenantId) setTenantId(tId);
  }, [tenantId]);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === productId ? { ...i, quantity: Math.max(0, Math.min(qty, i.stock)) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setTenantId(null);
  }, []);

  const totalQty = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((s, i) => s + i.quantity * i.price, 0), [items]);

  return (
    <ShopCartContext.Provider value={{ items, tenantId, totalQty, totalPrice, addItem, removeItem, updateQty, clear }}>
      {children}
    </ShopCartContext.Provider>
  );
};

export const useShopCart = () => {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error("useShopCart must be used inside ShopCartProvider");
  return ctx;
};
