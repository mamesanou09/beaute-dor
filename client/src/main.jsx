import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/700-italic.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import './index.css';

import { AuthProvider, CartProvider, FavoritesProvider, ShopProvider, ToastProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import { Login, Register } from './pages/Auth';
import { AccountLayout, Favorites, MyOrders, Profile, RequireAuth } from './pages/Account';
import { About, Brands, Categories, CGV, Contact, NotFound, Privacy } from './pages/InfoPages';
import AdminLayout, { RequireStaff } from './pages/admin/AdminLayout';
import { CategoriesAdmin, Customers, Dashboard, Messages, Orders, ProductForm, Products, SettingsAdmin } from './pages/admin/AdminPages';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ShopProvider>
            <CartProvider>
              <FavoritesProvider>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="boutique" element={<Shop />} />
                    <Route path="produit/:slug" element={<ProductDetail />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="marques" element={<Brands />} />
                    <Route path="a-propos" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="panier" element={<Cart />} />
                    <Route path="commande" element={<Checkout />} />
                    <Route path="commande/confirmation/:reference" element={<OrderConfirmation />} />
                    <Route path="connexion" element={<Login />} />
                    <Route path="inscription" element={<Register />} />
                    <Route path="cgv" element={<CGV />} />
                    <Route path="confidentialite" element={<Privacy />} />
                    <Route path="compte" element={<RequireAuth><AccountLayout /></RequireAuth>}>
                      <Route index element={<Profile />} />
                      <Route path="commandes" element={<MyOrders />} />
                      <Route path="favoris" element={<Favorites />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  <Route path="admin" element={<RequireStaff><AdminLayout /></RequireStaff>}>
                    <Route index element={<Dashboard />} />
                    <Route path="commandes" element={<Orders />} />
                    <Route path="produits" element={<Products />} />
                    <Route path="produits/nouveau" element={<ProductForm />} />
                    <Route path="produits/:id" element={<ProductForm />} />
                    <Route path="categories" element={<CategoriesAdmin />} />
                    <Route path="clients" element={<Customers />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="parametres" element={<SettingsAdmin />} />
                  </Route>
                </Routes>
              </FavoritesProvider>
            </CartProvider>
          </ShopProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
