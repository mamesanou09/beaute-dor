import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';

/* ------------------------------------------------------------------ */
/* Paramètres boutique + catégories (chargés une fois)                 */
/* ------------------------------------------------------------------ */
const ShopCtx = createContext(null);
const DEFAULT_SETTINGS = {
  whatsapp_number: '221783676372',
  shop_phone: '+221 78 367 63 72',
  shop_email: 'contact@beautedor.sn',
  shop_address: 'Rufisque, Sénégal',
};

export function ShopProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  useEffect(() => {
    api.get('/api/settings').then((s) => setSettings({ ...DEFAULT_SETTINGS, ...s })).catch(() => {});
    api.get('/api/categories').then(setCategories).catch(() => {});
    api.get('/api/brands').then(setBrands).catch(() => {});
  }, []);
  return <ShopCtx.Provider value={{ settings, categories, brands }}>{children}</ShopCtx.Provider>;
}
export const useShop = () => useContext(ShopCtx);

/* ------------------------------------------------------------------ */
/* Notifications (toasts)                                             */
/* ------------------------------------------------------------------ */
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);
  const dismiss = useCallback((tid) => setToasts((t) => t.filter((x) => x.id !== tid)), []);
  const notify = useCallback((message, opts = {}) => {
    const tid = ++id.current;
    setToasts((t) => [...t.slice(-2), { id: tid, message, type: opts.type || 'success', image: opts.image }]);
    setTimeout(() => dismiss(tid), opts.duration || 3500);
  }, [dismiss]);
  return <ToastCtx.Provider value={{ toasts, notify, dismiss }}>{children}</ToastCtx.Provider>;
}
export const useToast = () => useContext(ToastCtx);

/* ------------------------------------------------------------------ */
/* Authentification                                                   */
/* ------------------------------------------------------------------ */
const AuthCtx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.get('/api/auth/me').then((r) => setUser(r.user)).catch(() => {}).finally(() => setReady(true));
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    can: (perm) => !!user?.permissions?.includes(perm),
    isStaff: user?.role === 'admin' || user?.role === 'staff',
    login: async (email, password) => { const r = await api.post('/api/auth/login', { email, password }); setUser(r.user); return r.user; },
    register: async (data) => { const r = await api.post('/api/auth/register', data); setUser(r.user); return r.user; },
    logout: async () => { await api.post('/api/auth/logout'); setUser(null); },
    updateProfile: async (data) => { const r = await api.put('/api/auth/me', data); setUser(r.user); return r.user; },
  }), [user, ready]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

/* ------------------------------------------------------------------ */
/* Panier — persistant dans localStorage                               */
/* ------------------------------------------------------------------ */
const CartCtx = createContext(null);
const CART_KEY = 'bdo_cart_v1';

const readStorage = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const writeStorage = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* mode privé */ } };

const snapshot = (p) => ({
  id: p.id, slug: p.slug, name: p.name, brand: p.brand, format: p.format,
  price: p.price, old_price: p.old_price, image_url: p.image_url, stock: p.stock,
});

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStorage(CART_KEY, []));
  const { notify } = useToast();

  useEffect(() => writeStorage(CART_KEY, items), [items]);

  // Synchronise entre onglets
  useEffect(() => {
    const onStorage = (e) => { if (e.key === CART_KEY) setItems(readStorage(CART_KEY, [])); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((product, qty = 1) => {
    if (product.stock !== undefined && product.stock <= 0) {
      notify('Ce produit est en rupture de stock.', { type: 'error' });
      return;
    }
    setItems((cur) => {
      const found = cur.find((i) => i.id === product.id);
      const max = product.stock ?? 50;
      if (found) return cur.map((i) => (i.id === product.id ? { ...i, ...snapshot(product), quantity: Math.min(max, i.quantity + qty) } : i));
      return [...cur, { ...snapshot(product), quantity: Math.min(max, qty) }];
    });
    notify(`${product.name} ${product.brand || ''} ajouté au panier`, { image: product.image_url });
  }, [notify]);

  const setQty = useCallback((id, qty) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(i.stock ?? 50, qty)) } : i)));
  }, []);
  const remove = useCallback((id) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  /** Met à jour prix/stock depuis le serveur (les prix ont pu changer). */
  const refresh = useCallback((fresh) => {
    setItems((cur) => cur
      .map((i) => { const f = fresh.find((p) => p.id === i.id); return f ? { ...i, ...snapshot(f), quantity: Math.min(i.quantity, Math.max(f.stock, 1)) } : null; })
      .filter(Boolean));
  }, []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear, refresh, count, subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}
export const useCart = () => useContext(CartCtx);

/* ------------------------------------------------------------------ */
/* Favoris — localStorage, synchronisés avec le compte si connecté      */
/* ------------------------------------------------------------------ */
const FavCtx = createContext(null);
const FAV_KEY = 'bdo_favs_v1';

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(() => readStorage(FAV_KEY, []));
  const { user } = useAuth();
  const { notify } = useToast();

  useEffect(() => writeStorage(FAV_KEY, ids), [ids]);

  // À la connexion : fusionne favoris locaux et favoris du compte
  useEffect(() => {
    if (!user) return;
    api.get('/api/favorites').then(async (server) => {
      const serverIds = server.map((p) => p.id);
      const local = readStorage(FAV_KEY, []);
      await Promise.all(local.filter((id) => !serverIds.includes(id)).map((id) => api.post(`/api/favorites/${id}`).catch(() => {})));
      setIds([...new Set([...serverIds, ...local])]);
    }).catch(() => {});
  }, [user]);

  const toggle = useCallback((product) => {
    const has = ids.includes(product.id);
    setIds((cur) => (has ? cur.filter((i) => i !== product.id) : [...new Set([...cur, product.id])]));
    if (user) (has ? api.del(`/api/favorites/${product.id}`) : api.post(`/api/favorites/${product.id}`)).catch(() => {});
    notify(has ? 'Retiré de vos favoris' : 'Ajouté à vos favoris', { type: has ? 'info' : 'success' });
  }, [ids, user, notify]);

  return <FavCtx.Provider value={{ ids, toggle, has: (id) => ids.includes(id) }}>{children}</FavCtx.Provider>;
}
export const useFavorites = () => useContext(FavCtx);
