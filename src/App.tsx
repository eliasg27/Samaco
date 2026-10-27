import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, ShoppingCart, Heart, User, ChevronRight, ChevronLeft, ChevronDown,
  Truck, Package, Plus, Minus, Check, Clock, CreditCard, Building2,
  Star, ArrowRight, Menu, X, Phone, MapPin, Mail, Info, Trash2,
  Shield, Instagram, Facebook, Linkedin, Archive, Zap, Calculator,
  Layers, Navigation, BadgeCheck, LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { CPS, parseRoute, paths, Route, VIEW_PATHS } from './routes';
import { slugify } from './lib/slug';
import { aplanarCategorias } from './lib/categorias';
import { limpiarHtml } from './lib/html';
import { View, Product, CartItem } from './types';
import { commerce } from './services';
import { useCategories, useProductByHandle, useProducts, useProductsByIds, useProductSearch } from './services/hooks';
import { useProfesional } from './profesionales/context';
import { CirculoView } from './profesionales/CirculoView';
import { AccesoView } from './profesionales/AccesoView';
import { PanelView } from './profesionales/PanelView';
import { EventoView } from './profesionales/EventoView';
import { CPS_LOGO } from './profesionales/ui';
import { CarruselMediosPago } from './financiacion/CarruselMediosPago';
import { FinanciacionView } from './financiacion/FinanciacionView';
import { conVigencia, descuentoTransferencia } from './financiacion/data';
import { useContenido } from './contenido';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────


const WHY_SAMACO = [
  { icon: Package,   title: 'Stock Garantizado', description: 'Más de 5.000 productos en stock permanente. Lo que necesitás, cuando lo necesitás.',    color: 'bg-blue-50',    iconColor: 'text-[#1B4F8C]'   },
  { icon: Truck,     title: 'Entrega en Obra',   description: 'Flota propia para entregas en toda Mendoza. Puntualidad y cuidado asegurados.',          color: 'bg-orange-50',  iconColor: 'text-[#E8593C]'   },
  { icon: Archive,   title: 'Acopio sin Cargo',  description: 'Congelá el precio hoy y retirá cuando necesitás. Guardamos tu compra hasta 12 meses.',   color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { icon: Building2, title: '3 Sucursales',      description: 'Casa Central, Luján de Cuyo y Samaco Instalaciones. Siempre cerca tuyo en Mendoza.',  color: 'bg-purple-50',  iconColor: 'text-purple-600'  },
];

const BRANDS_LIST = ['FV', 'Roca', 'Eskabe', 'Elizabeth', 'RDAU', 'Genebre', 'Dune', 'Peirano', 'Ferrum', 'Casal'];

const SUCURSALES = [
  {
    id: 'central',
    name: 'Casa Central',
    address: 'Av. San Martín 1234, Godoy Cruz',
    phone: '(0261) 555-0001',
    hours: 'Lun–Vie 8:00–18:00 / Sáb 8:00–13:00',
    email: 'central@samacoonline.com.ar',
    mapUrl: 'https://maps.app.goo.gl/67mCwa9A3cpLL5P7A',
    icon: '🏢',
    color: 'bg-[#1B4F8C]',
    description: 'Sede principal con el mayor showroom y stock. Equipo de asesores técnicos especializados.',
    features: ['Showroom 800m²', 'Estacionamiento propio', 'Asesoramiento técnico', 'Acopio de materiales'],
  },
  {
    id: 'lujan',
    name: 'Luján de Cuyo',
    address: 'Acceso Sur km 12.5, Luján de Cuyo',
    phone: '(0261) 555-0002',
    hours: 'Lun–Vie 8:00–18:00 / Sáb 8:00–13:00',
    email: 'lujan@samacoonline.com.ar',
    mapUrl: 'https://maps.app.goo.gl/MVVnYhWcSxibKigC9',
    icon: '🏗️',
    color: 'bg-emerald-600',
    description: 'Especializada en obra gruesa y materiales pesados. Logística de entrega en zona sur.',
    features: ['Grandes volúmenes', 'Entrega zona sur', 'Hormigón elaborado', 'Autoelevador'],
  },
  {
    id: 'instalaciones',
    name: 'Samaco Instalaciones',
    address: 'Mitre 890, Ciudad de Mendoza',
    phone: '(0261) 555-0004',
    hours: 'Lun–Vie 8:00–18:00 / Sáb 9:00–13:00',
    email: 'instalaciones@samacoonline.com.ar',
    mapUrl: 'https://maps.app.goo.gl/U5KZ17fJMqZrybPK8',
    icon: '🔧',
    color: 'bg-[#E8593C]',
    description: 'Todo en plomería, electricidad y calefacción. Instaladores matriculados disponibles.',
    features: ['Plomería y sanitarios', 'Electricidad', 'Calefacción y AC', 'Instaladores matriculados'],
  },
];

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

const fmt = (n: number) => '$' + n.toLocaleString('es-AR');

// ─────────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// STOCK BADGE
// ─────────────────────────────────────────────

const StockBadge = ({ status }: { status: 'in_stock' | 'low_stock' | 'out_of_stock' }) => {
  const cfg = {
    in_stock:     { label: 'Hay stock',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    low_stock:    { label: 'Últimas unidades', cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
    out_of_stock: { label: 'Sin stock',        cls: 'bg-slate-100 text-slate-500 border-slate-200',      dot: 'bg-slate-400'   },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'in_stock' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onAddToCart: (p: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isComparing?: boolean;
  onToggleCompare?: (id: string) => void;
}

const ProductCard = ({ product, onClick, onAddToCart, isFavorite, onToggleFavorite, isComparing = false, onToggleCompare }: ProductCardProps) => (
  <motion.article
    whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }}
    transition={{ duration: 0.2 }}
    className="bg-white rounded-2xl border border-slate-100 flex flex-col cursor-pointer overflow-hidden shadow-sm"
    onClick={onClick}
    aria-label={`Ver ${product.name}`}
  >
    {/* Image */}
    <div className="relative bg-slate-50 h-48 flex items-center justify-center overflow-hidden product-img-wrap">
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="product-img-wrap max-h-40 w-full object-contain p-4"
      />
      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
        {product.isNew && (
          <span className="bg-[#1B4F8C] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Nuevo</span>
        )}
        {product.discount && (
          <span className="bg-[#E8593C] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{product.discount}% OFF</span>
        )}
      </div>
      <button
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        onClick={e => { e.stopPropagation(); onToggleFavorite(product.id); }}
        className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
      >
        <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-[#E8593C] text-[#E8593C]' : 'text-slate-300'}`} />
      </button>
    </div>

    {/* Body */}
    <div className="flex flex-col flex-1 p-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{product.brand}</p>
      <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 mb-3 flex-1">{product.name}</h3>
      <div className="mb-3">
        <StockBadge status={product.stockStatus} />
      </div>
      <div className="mb-4 space-y-0.5">
        <div className="text-[#E8593C] font-black text-lg leading-none">
          {fmt(product.installmentPrice ?? 0)}
          <span className="text-xs font-normal text-slate-400 ml-1">/ cuota</span>
        </div>
        <p className="text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">{fmt(product.cashPrice)}</span> con transferencia
          <span className="ml-1 text-emerald-600 font-bold">−15%</span>
        </p>
        <p className="text-[10px] text-slate-400 line-through">{fmt(product.listPrice)}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={e => { e.stopPropagation(); onAddToCart(product); }}
          disabled={product.stockStatus === 'out_of_stock'}
          className="flex-1 py-2.5 bg-[#1B4F8C] hover:bg-[#163f70] disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {product.stockStatus === 'out_of_stock' ? 'Sin stock' : 'Agregar'}
        </button>
        {onToggleCompare && (
          <button
            onClick={e => { e.stopPropagation(); onToggleCompare(product.id); }}
            title="Comparar producto"
            className={`px-2.5 rounded-xl border-2 transition-all text-[10px] font-bold
              ${isComparing ? 'bg-[#1B4F8C] border-[#1B4F8C] text-white' : 'border-slate-200 text-slate-400 hover:border-[#1B4F8C] hover:text-[#1B4F8C]'}`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  </motion.article>
);

const ProductGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse" aria-hidden>
        <div className="h-48 bg-slate-100 rounded-t-2xl" />
        <div className="p-4 space-y-2">
          <div className="h-2 w-1/3 bg-slate-100 rounded" />
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>
    ))}
  </>
);

// ─────────────────────────────────────────────
// MINI CART
// ─────────────────────────────────────────────

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  navigateTo: (v: View, p?: Product, c?: string) => void;
}

const MiniCart = ({ isOpen, onClose, cartItems, onUpdate, onRemove }: MiniCartProps) => {
  const total = cartItems.reduce((acc, i) => acc + i.product.cashPrice * i.quantity, 0);
  const [checkingOut,   setCheckingOut]   = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => { setCheckoutError(null); }, [cartItems, isOpen]);

  // El pago lo resuelve el checkout de Shopify: armamos el carrito allá y redirigimos.
  const goToCheckout = async () => {
    setCheckingOut(true);
    setCheckoutError(null);
    const result = await commerce.createCheckout(cartItems);
    if ('url' in result) { window.location.href = result.url; return; }
    setCheckoutError(result.message);
    setCheckingOut(false);
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200]"
            onClick={onClose} aria-hidden
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-white z-[201] flex flex-col shadow-2xl"
            aria-label="Carrito de compras"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-[#1B4F8C]" />
                <h2 className="font-black text-slate-800">Tu carrito</h2>
                {cartItems.length > 0 && (
                  <span className="bg-[#E8593C] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItems.reduce((a, i) => a + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button onClick={onClose} aria-label="Cerrar carrito" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartItems.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-semibold">Tu carrito está vacío</p>
                  <p className="text-sm mt-1">¡Empezá a agregar productos!</p>
                </div>
              )}
              {cartItems.map(item => (
                <div key={item.product.id} className="flex gap-3 p-3 bg-slate-50 rounded-2xl">
                  <img src={item.product.image} alt={item.product.name} referrerPolicy="no-referrer"
                    className="w-16 h-16 object-contain bg-white rounded-xl p-1 border border-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.product.brand}</p>
                    <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">{item.product.name}</p>
                    <p className="text-sm font-black text-[#1B4F8C] mt-1">{fmt(item.product.cashPrice)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => onRemove(item.product.id)} aria-label="Eliminar" className="text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <button onClick={() => onUpdate(item.product.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 text-slate-500 text-sm font-bold">-</button>
                      <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => onUpdate(item.product.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 text-slate-500 text-sm font-bold">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 px-6 py-5 space-y-3">
                <div className="flex justify-between font-bold text-sm text-slate-700">
                  <span>Subtotal con transferencia</span>
                  <span className="text-[#1B4F8C] font-black text-base">{fmt(total)}</span>
                </div>
                <p className="text-[10px] text-slate-400 text-center">15% OFF pagando con transferencia bancaria (compra online)</p>
                <button onClick={goToCheckout} disabled={checkingOut}
                  className="w-full py-4 bg-[#E8593C] hover:bg-[#d14a2f] disabled:bg-slate-300 text-white font-black rounded-2xl transition-colors text-sm shadow-lg">
                  {checkingOut ? 'Redirigiendo al pago…' : 'Ir a pagar'}
                </button>
                {checkoutError && (
                  <p role="alert" className="text-[11px] text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{checkoutError}</p>
                )}
                <a
                  href={`https://wa.me/5492615555555?text=${encodeURIComponent(
                    'Hola Samaco! Quiero consultar disponibilidad y coordinar entrega:\n\n' +
                    cartItems.map(i => `• ${i.product.name} (x${i.quantity}) — ${fmt(i.product.cashPrice * i.quantity)}`).join('\n') +
                    `\n\nTotal estimado: ${fmt(total)}\n\n¿Pueden confirmar stock?`
                  )}`}
                  target="_blank" rel="noreferrer"
                  className="w-full py-3 bg-[#25D366] hover:bg-[#1ebe58] text-white font-black rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />Pedir presupuesto por WhatsApp
                </a>
                <button onClick={onClose} className="w-full py-3 border-2 border-slate-200 hover:border-[#1B4F8C] text-slate-700 font-bold rounded-2xl transition-colors text-sm">
                  Seguir comprando
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────

interface HeaderProps {
  navigateTo: (v: View, p?: Product, c?: string) => void;
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cartCount: number;
  favCount: number;
  setCartOpen: (b: boolean) => void;
  showSugg: boolean;
  setShowSugg: (b: boolean) => void;
}

const Header = ({ navigateTo, searchQuery, handleSearch, cartCount, favCount, setCartOpen, showSugg, setShowSugg }: HeaderProps) => {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [megaMenu,    setMegaMenu]    = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const megaTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Histéresis: al compactarse el header la página se mueve ~56px; con un único umbral (60px) eso lo
    // hacía cruzar el límite de ida y vuelta y parpadeaba. Compacta pasando 120px y se expande recién arriba de todo.
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(prev => (prev ? y > 8 : y > 120));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openMega  = (cat: string) => { clearTimeout(megaTimer.current); setMegaMenu(cat); };
  const closeMega = () => { megaTimer.current = setTimeout(() => setMegaMenu(null), 120); };

  const navigate = useNavigate();
  const { profesional, salir } = useProfesional();
  const { data: categories }  = useCategories();
  const { data: sugProducts } = useProductSearch(searchQuery, 4);
  const q             = searchQuery.trim().toLowerCase();
  const sugCategories = q.length >= 2 ? categories.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3) : [];

  // Cinta superior: mensajes editables en Shopify ("Textos del sitio") + promos y accesos fijos.
  const contenido = useContenido();
  const promo9 = contenido.destacada;
  const transf = descuentoTransferencia(contenido.medios);
  const topBarItems: { label: string; icon?: React.ReactNode; onClick?: () => void; href?: string }[] = [
    ...contenido.cinta.map(label => ({ label: conVigencia(label), icon: <span className="w-1.5 h-1.5 rounded-full bg-[#E8593C] animate-pulse" /> })),
    ...(promo9 ? [{ label: `${promo9.titulo} todos los días`, icon: <CreditCard className="w-3 h-3" />, onClick: () => navigateTo('financiacion') }] : []),
    ...(transf ? [{ label: `${transf}% OFF con transferencia`, onClick: () => navigateTo('financiacion') }] : []),
    { label: 'WhatsApp atención', icon: <Phone className="w-3 h-3" />, href: 'https://wa.me/5492615555555' },
    { label: '3 sucursales en Mendoza', icon: <MapPin className="w-3 h-3" />, onClick: () => navigateTo('sucursales') },
    { label: 'Círculo de Profesionales', icon: <BadgeCheck className="w-3 h-3" />, onClick: () => navigateTo('profesionales') },
  ];

  return (
    <>
      <header className={`bg-white sticky top-0 z-[100] border-b border-slate-100 transition-shadow duration-300 ${scrolled ? 'shadow-lg' : 'shadow-sm'}`}>
        {/* Top bar: cinta que se desliza sola (marquee CSS, pausa con hover). La copia duplicada cierra el loop. */}
        <div className={`marquee bg-[#1B4F8C] text-white overflow-hidden motion-reduce:overflow-x-auto no-scrollbar transition-all duration-300 ${scrolled ? 'h-0' : ''}`}>
          <div className="marquee-track flex py-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ ['--marquee-dur' as string]: '40s' }}>
            {[false, true].map(copia => (
              <div key={String(copia)} aria-hidden={copia || undefined} className={`flex items-center shrink-0 ${copia ? 'motion-reduce:hidden' : ''}`}>
                {topBarItems.map((item, i) => (
                  <span key={i} className="flex items-center px-8 border-r border-white/15">
                    {item.onClick
                      ? <button tabIndex={copia ? -1 : undefined} onClick={item.onClick} className="flex items-center gap-1.5 uppercase tracking-widest hover:text-[#E8593C] transition-colors">{item.icon}{item.label}</button>
                      : item.href
                        ? <a tabIndex={copia ? -1 : undefined} href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-green-300 transition-colors">{item.icon}{item.label}</a>
                        : <span className="flex items-center gap-1.5">{item.icon}{item.label}</span>}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main row */}
        <div className={`container mx-auto px-4 md:px-8 max-w-7xl flex items-center gap-4 md:gap-8 transition-all duration-300 ${scrolled ? 'h-14' : 'h-20'}`}>
          {/* Logo */}
          <button onClick={() => navigateTo('home')} aria-label="Samaco — Inicio" className="shrink-0 transition-opacity hover:opacity-80">
            <img src="/logo-samaco.png" alt="Samaco" width={791} height={217}
              className={`w-auto transition-all duration-300 ${scrolled ? 'h-7' : 'h-9'}`} />
          </button>

          {/* Search */}
          <form role="search" className="flex-1 max-w-2xl relative hidden md:block"
            onSubmit={e => { e.preventDefault(); if (searchQuery.trim().length >= 2) { navigate(paths.buscar(searchQuery)); setShowSugg(false); } }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="search" placeholder="Buscar productos, marcas o categorías..." aria-label="Buscar productos"
              value={searchQuery} onChange={handleSearch}
              onFocus={() => setShowSugg(true)}
              onBlur={() => setTimeout(() => setShowSugg(false), 200)}
              className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#1B4F8C] focus:bg-white pl-11 pr-4 py-3 rounded-2xl text-sm outline-none transition-all"
            />
            <AnimatePresence>
              {showSugg && (sugProducts.length > 0 || sugCategories.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-2">
                  {sugCategories.length > 0 && (
                    <>
                      <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorías</p>
                      {sugCategories.map(c => (
                        <button key={c.id} type="button" onMouseDown={() => navigateTo('category', undefined, c.name)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                          <span className="text-xl">{c.icon}</span>
                          <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {sugProducts.length > 0 && (
                    <>
                      <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 mt-1">Productos</p>
                      {sugProducts.map(p => (
                        <button key={p.id} type="button" onMouseDown={() => navigateTo('product', p)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                          <img src={p.image} alt="" referrerPolicy="no-referrer" className="w-10 h-10 object-contain bg-slate-100 rounded-lg p-1 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.brand} · {fmt(p.cashPrice)}</p>
                          </div>
                        </button>
                      ))}
                      <button type="button" onMouseDown={() => navigate(paths.buscar(searchQuery))}
                        className="w-full px-4 py-2.5 border-t border-slate-50 mt-1 text-left text-xs font-bold text-[#1B4F8C] hover:bg-slate-50">
                        Ver todos los resultados para “{searchQuery.trim()}” →
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Icons */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            {/* Círculo de Profesionales: landing si no entró, panel si ya es miembro */}
            <div className="relative group">
              <button onClick={() => navigateTo(profesional ? 'panel' : 'profesionales')}
                aria-label={profesional
                  ? `Círculo de Profesionales: ${profesional.estado === 'aprobado' ? 'membresía activa' : 'solicitud en revisión'}`
                  : 'Círculo de Profesionales'}
                className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors relative">
                <img src={CPS_LOGO.isotipo.src} width={CPS_LOGO.isotipo.w} height={CPS_LOGO.isotipo.h} alt="" aria-hidden className="w-8 h-8" />
                {profesional?.estado === 'aprobado' && (
                  <span className="absolute top-0.5 right-0.5 bg-emerald-500 text-white w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white">
                    <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                  </span>
                )}
                {profesional && profesional.estado !== 'aprobado' && (
                  <span className="absolute top-1 right-1 bg-[#E8593C] w-2.5 h-2.5 rounded-full ring-2 ring-white" />
                )}
              </button>
              <span role="tooltip"
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hidden md:block z-50">
                Círculo de Profesionales
              </span>
            </div>

            {/* Account dropdown */}
            <div className="relative hidden sm:block">
              <button onClick={() => setAccountOpen(v => !v)} aria-label="Mi cuenta"
                className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1 text-slate-600">
                <User className="w-5 h-5" /><ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden w-60 z-50"
                    onMouseLeave={() => setAccountOpen(false)}>
                    {profesional ? (
                      <>
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-black text-slate-800 truncate">{profesional.nombre} {profesional.apellido}</p>
                          <p className="text-[11px] text-slate-400">{profesional.estado === 'aprobado' ? 'Miembro del Círculo' : 'Matrícula en revisión'}</p>
                        </div>
                        <button onClick={() => { navigateTo('panel'); setAccountOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                          <BadgeCheck className="w-4 h-4 text-[#1B4F8C]" />Mi panel profesional
                        </button>
                        <button onClick={async () => { await salir(); setAccountOpen(false); navigateTo('home'); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-t border-slate-100 transition-colors text-sm font-medium text-slate-500">
                          <LogOut className="w-4 h-4 text-slate-400" />Cerrar sesión
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { navigateTo('pro-ingresar'); setAccountOpen(false); }}
                          className="w-full px-4 py-3 hover:bg-slate-50 text-sm font-bold text-[#E8593C] text-left transition-colors">
                          Ingresar / Registrarse
                        </button>
                        <button onClick={() => { navigateTo('profesionales'); setAccountOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-t border-slate-100 transition-colors text-sm font-medium text-slate-700 text-left">
                          <img src={CPS_LOGO.isotipo.src} alt="" aria-hidden className="w-7 h-7 shrink-0" />
                          <span>Círculo de Profesionales<span className="block text-[11px] text-slate-400 font-normal">Para profesionales de la construcción</span></span>
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Favorites */}
            <button aria-label="Mis favoritos" className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors relative text-slate-600 hidden sm:block">
              <Heart className="w-5 h-5" />
              {favCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#E8593C] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{favCount}</span>}
            </button>

            {/* Cart */}
            <button onClick={() => setCartOpen(true)} aria-label="Ver carrito"
              className="p-2.5 bg-[#1B4F8C] hover:bg-[#163f70] rounded-xl transition-colors relative text-white shadow-sm">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#E8593C] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">{cartCount}</span>}
            </button>

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="md:hidden p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category nav – desktop */}
        <nav className="bg-white border-t border-slate-100 hidden md:block" aria-label="Categorías principales">
          <div className="container mx-auto px-8 max-w-7xl">
            {/* Sin overflow: un contenedor con scroll recorta el desplegable de subcategorías. */}
            <ul className="flex flex-wrap items-center">
              {categories.map(cat => (
                <li key={cat.id} className="relative shrink-0" onMouseEnter={() => openMega(cat.name)} onMouseLeave={closeMega}>
                  <button onClick={() => navigateTo('category', undefined, cat.name)}
                    className={`flex items-center gap-1 px-4 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap
                      ${cat.name === 'Ofertas' ? 'text-[#E8593C] border-transparent hover:border-[#E8593C]' : 'text-slate-500 border-transparent hover:text-[#1B4F8C] hover:border-[#1B4F8C]'}`}>
                    {cat.name}
                    {cat.children && <ChevronDown className="w-3 h-3 opacity-50" />}
                  </button>
                  <AnimatePresence>
                    {megaMenu === cat.name && cat.children && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 bg-white shadow-2xl rounded-2xl border border-slate-100 z-50 p-3 w-56"
                        onMouseEnter={() => openMega(cat.name)} onMouseLeave={closeMega}>
                        {/* Subcategorías: en Shopify son los elementos anidados del menú "Categorías sitio". */}
                        {cat.children.map(sub => (
                          <button key={sub.id} onClick={() => { navigateTo('category', undefined, sub.name); setMegaMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:text-[#1B4F8C] hover:bg-slate-50 rounded-xl transition-colors text-left">
                            <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />{sub.name}
                          </button>
                        ))}
                        <button onClick={() => { navigateTo('category', undefined, cat.name); setMegaMenu(null); }}
                          className="w-full mt-1 pt-2.5 border-t border-slate-100 px-3 pb-1 text-xs font-bold text-[#1B4F8C] hover:underline text-left">
                          Ver todo {cat.name} →
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[150]" onClick={() => setMobileOpen(false)} />
            <motion.nav initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              aria-label="Menú móvil"
              className="fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white z-[151] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <img src="/logo-samaco.png" alt="Samaco" width={791} height={217} className="h-7 w-auto" />
                <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="overflow-y-auto flex-1 py-4">
                <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categorías</p>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => { navigateTo('category', undefined, cat.name); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left">
                    <span className="text-xl">{cat.icon}</span>
                    <span className={`font-semibold text-sm ${cat.name === 'Ofertas' ? 'text-[#E8593C]' : 'text-slate-700'}`}>{cat.name}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-2 pb-2">
                <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pt-2">Herramientas</p>
                <button onClick={() => { navigateTo('calculadora'); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left">
                  <Calculator className="w-5 h-5 text-[#1B4F8C]" />
                  <span className="font-semibold text-sm text-slate-700">Calculadora de materiales</span>
                </button>
                <button onClick={() => { navigateTo('sucursales'); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left">
                  <MapPin className="w-5 h-5 text-[#1B4F8C]" />
                  <span className="font-semibold text-sm text-slate-700">Nuestras sucursales</span>
                </button>
                <button onClick={() => { navigateTo(profesional ? 'panel' : 'profesionales'); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left">
                  <BadgeCheck className="w-5 h-5 text-[#1B4F8C]" />
                  <span className="font-semibold text-sm text-slate-700">{profesional ? 'Mi panel profesional' : 'Círculo de Profesionales'}</span>
                </button>
              </div>
              <div className="border-t border-slate-100 p-5">
                <a href="https://wa.me/5492615555555" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-[#25D366]">
                  <Phone className="w-4 h-4" />WhatsApp atención
                </a>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────

/** Redes oficiales de Samaco (footer). */
const REDES = [
  { label: 'Instagram', href: 'https://www.instagram.com/samacooficial/', Icon: Instagram },
  { label: 'Facebook',  href: 'https://www.facebook.com/samacoOficial',   Icon: Facebook },
  { label: 'LinkedIn',  href: 'https://www.linkedin.com/company/samaco-s-arg/', Icon: Linkedin },
];

const Footer = ({ navigateTo }: { navigateTo: (v: View, p?: Product, c?: string) => void }) => {
  const { data: categories } = useCategories();
  return (
  <footer className="bg-[#0d2a4d] text-white">
    <div className="container mx-auto px-6 md:px-8 max-w-7xl py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
      {/* Brand */}
      <div>
        <img src="/logo-samaco-blanco.png" alt="Samaco" width={791} height={217} className="h-9 w-auto mb-5" />
        <p className="text-slate-400 text-sm leading-relaxed mb-5">Materiales de construcción y hogar en Mendoza. Más de 5.000 productos en stock con las mejores marcas del mercado.</p>
        <div className="flex gap-3">
          {REDES.map(({ label, href, Icon }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Samaco en ${label}`} title={label}
              className="w-9 h-9 bg-white/10 hover:bg-[#E8593C] rounded-xl flex items-center justify-center transition-colors">
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
      {/* Categories */}
      <div>
        <h4 className="font-black text-sm uppercase tracking-widest mb-5 text-slate-300">Categorías</h4>
        <ul className="space-y-2.5">
          {categories.slice(0, 7).map(c => (
            <li key={c.id}>
              <button onClick={() => navigateTo('category', undefined, c.name)} className="text-slate-400 hover:text-white text-sm transition-colors text-left">{c.name}</button>
            </li>
          ))}
        </ul>
      </div>
      {/* Sucursales + Herramientas */}
      <div>
        <h4 className="font-black text-sm uppercase tracking-widest mb-5 text-slate-300">Sucursales</h4>
        <ul className="space-y-3 mb-6">
          {SUCURSALES.map(s => (
            <li key={s.id}>
              <p className="text-white text-sm font-bold">{s.name}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s.address}</p>
              <a href={s.mapUrl} target="_blank" rel="noreferrer" aria-label={`Cómo llegar a ${s.name} (Google Maps)`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E8593C] hover:text-white transition-colors mt-1">
                <MapPin className="w-3 h-3" />Cómo llegar
              </a>
            </li>
          ))}
        </ul>
        <button onClick={() => navigateTo('sucursales')}
          className="text-[#E8593C] hover:text-white text-xs font-bold transition-colors flex items-center gap-1">
          <Navigation className="w-3 h-3" />Ver mapa y horarios →
        </button>
        <div className="mt-6">
          <button onClick={() => navigateTo('calculadora')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <Calculator className="w-4 h-4 text-[#E8593C]" />Calculadora de materiales
          </button>
        </div>
      </div>
      {/* Contact */}
      <div>
        <h4 className="font-black text-sm uppercase tracking-widest mb-5 text-slate-300">Contacto</h4>
        <ul className="space-y-3 text-sm mb-5">
          <li className="flex items-start gap-2.5 text-slate-400"><Phone className="w-4 h-4 mt-0.5 text-[#E8593C] shrink-0" />(0261) 555-0000</li>
          <li className="flex items-start gap-2.5 text-slate-400"><Mail  className="w-4 h-4 mt-0.5 text-[#E8593C] shrink-0" />ventas@samacoonline.com.ar</li>
          <li className="flex items-start gap-2.5 text-slate-400"><Clock className="w-4 h-4 mt-0.5 text-[#E8593C] shrink-0" /><span>Lun–Vie 8:00–18:00<br />Sáb 8:00–13:00</span></li>
        </ul>
        <a href="https://wa.me/5492615555555" target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe58] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
          <Phone className="w-4 h-4" />Escribinos por WhatsApp
        </a>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="container mx-auto px-6 md:px-8 max-w-7xl py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Samaco Materiales S.A. — Todos los derechos reservados</p>
        <div className="flex gap-5 flex-wrap justify-center">
          <a href="#" className="hover:text-white transition-colors">Política de privacidad</a>
          <a href="#" className="hover:text-white transition-colors">Términos y condiciones</a>
          <a href="#" className="hover:text-white transition-colors">Defensa al consumidor</a>
        </div>
      </div>
    </div>
  </footer>
  );
};

// ─────────────────────────────────────────────
// APP CONTEXT TYPE
// ─────────────────────────────────────────────

interface AppCtx {
  navigateTo: (v: View, p?: Product, c?: string) => void;
  addToCart: (p: Product, qty?: number) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  compareList: string[];
  toggleCompare: (id: string) => void;
}

// ─────────────────────────────────────────────
// HOME VIEW
// ─────────────────────────────────────────────

function HomeView({ ctx }: { ctx: AppCtx }) {
  const { navigateTo, addToCart, favorites, toggleFavorite, compareList, toggleCompare } = ctx;
  const [slide, setSlide] = useState(0);
  // Banners editables en Shopify ("Banner de la home"); los de fecha vencida ya vienen filtrados.
  const { banners: HERO_SLIDES } = useContenido();
  const { data: categories } = useCategories();
  const { data: featured, loading: featuredLoading } = useProducts({ featured: true, limit: 8 });
  // Si en Shopify todavía no hay productos con la etiqueta "destacado", mostramos los últimos cargados.
  const { data: latest, loading: latestLoading } = useProducts({ limit: 8 });
  const homeProducts = featured.length > 0 ? featured : latest;
  const homeLoading  = featuredLoading || (featured.length === 0 && latestLoading);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % Math.max(HERO_SLIDES.length, 1)), 5000);
    return () => clearInterval(t);
  }, [HERO_SLIDES.length]);
  // Si cambia la cantidad de banners (llegan los de Shopify), no quedar en un índice que ya no existe.
  const actual = HERO_SLIDES[slide] ?? HERO_SLIDES[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

      {/* ── HERO SLIDER ── */}
      <section className="relative h-[460px] md:h-[560px] overflow-hidden bg-slate-900" aria-label="Slider principal">
        {HERO_SLIDES.map((s, i) => (
          <div key={i} aria-hidden={i !== slide}
            className={`hero-slide absolute inset-0 ${i === slide ? 'opacity-100' : 'opacity-0'}`}>
            <img src={s.imagen} alt="" loading={i === 0 ? 'eager' : 'lazy'} referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
          </div>
        ))}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6 md:px-12 max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div key={slide}
                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.5 }} className="max-w-xl text-white">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-5"
                  style={{ background: actual.colorEtiqueta }}>
                  {actual.etiqueta}
                </span>
                <h1 className="text-4xl md:text-6xl font-black leading-none tracking-tighter mb-5 whitespace-pre-line">
                  {actual.titulo}
                </h1>
                <p className="text-slate-300 text-base mb-8 leading-relaxed max-w-md">{conVigencia(actual.bajada, actual.vigencia)}</p>
                <button onClick={() => navigateTo(actual.destino)}
                  className="bg-[#E8593C] hover:bg-[#d14a2f] text-white font-black py-4 px-10 rounded-2xl text-sm uppercase tracking-widest transition-all shadow-2xl hover:-translate-y-0.5 active:translate-y-0">
                  {actual.boton}
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <button aria-label="Slide anterior" onClick={() => setSlide(s => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 backdrop-blur text-white rounded-full flex items-center justify-center transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button aria-label="Slide siguiente" onClick={() => setSlide(s => (s + 1) % HERO_SLIDES.length)}
          className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/20 hover:bg-white/40 backdrop-blur text-white rounded-full flex items-center justify-center transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} aria-label={`Ir al slide ${i+1}`} onClick={() => setSlide(i)}
              className={`rounded-full transition-all duration-300 ${i === slide ? 'w-8 h-3 bg-[#E8593C]' : 'w-3 h-3 bg-white/50 hover:bg-white/80'}`} />
          ))}
        </div>
      </section>

      {/* ── CALCULADORA CTA ── */}
      <section className="bg-amber-50 border-b border-amber-100 py-4">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-[#1B4F8C] rounded-xl flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm">Calculadora de materiales</p>
              <p className="text-xs text-slate-500">¿Cuánto cemento, pintura o hierro necesitás? Calculalo en segundos.</p>
            </div>
          </div>
          <button onClick={() => navigateTo('calculadora')}
            className="shrink-0 bg-[#1B4F8C] hover:bg-[#163f70] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap">
            Abrir calculadora →
          </button>
        </div>
      </section>

      {/* ── VALUE PROPS BAR ── */}
      <section className="bg-[#1B4F8C] text-white py-3.5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-[11px] font-bold uppercase tracking-widest">
            {([
              [Package, 'Stock garantizado'],
              [Archive, 'Acopio sin cargo'],
              [Truck,   'Entrega en obra'],
            ] as const).map(([Icon, label]) => (
              <span key={label} className="flex items-center gap-2"><Icon className="w-4 h-4 text-[#E8593C]" />{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES GRID ── (se oculta si la tienda todavía no tiene colecciones en el menú) */}
      {categories.length > 0 && (
      <section className="container mx-auto px-4 md:px-8 max-w-7xl py-14">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-8">Explorá por categoría</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {categories.map(cat => (
            <motion.button key={cat.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
              onClick={() => navigateTo('category', undefined, cat.name)}
              className="relative h-40 md:h-48 rounded-2xl overflow-hidden group text-left"
              aria-label={`Ver ${cat.name}`}>
              {cat.image
                ? <img src={cat.image} alt="" loading="lazy" referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                : /* Colección sin imagen en Shopify: fondo de marca en lugar de una imagen rota */
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#1B4F8C] to-[#0d2a4d]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-0 p-3 md:p-4">
                <span className="text-xl mb-0.5 block">{cat.icon}</span>
                <p className={`font-black text-sm leading-tight ${cat.name === 'Ofertas' ? 'text-[#E8593C]' : 'text-white'}`}>{cat.name}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>
      )}

      {/* ── FEATURED PRODUCTS ── */}
      {(homeLoading || homeProducts.length > 0) && (
      <section className="bg-white py-14">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {featured.length > 0 ? 'Productos destacados' : 'Nuestros productos'}
            </h2>
            <button onClick={() => navigateTo('category')}
              className="flex items-center gap-1.5 text-sm font-bold text-[#1B4F8C] hover:text-[#E8593C] transition-colors">
              Ver todo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {homeLoading && <ProductGridSkeleton count={8} />}
            {homeProducts.map(p => (
              <ProductCard key={p.id} product={p}
                onClick={() => navigateTo('product', p)} onAddToCart={addToCart}
                isFavorite={favorites.has(p.id)} onToggleFavorite={toggleFavorite}
                isComparing={compareList.includes(p.id)} onToggleCompare={toggleCompare} />
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── CÍRCULO DE PROFESIONALES ── */}
      <section className="bg-[#0d2a4d] text-white">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex gap-5 items-center">
            <img src={CPS_LOGO.isotipoBlanco.src} width={CPS_LOGO.isotipoBlanco.w} height={CPS_LOGO.isotipoBlanco.h} alt="" aria-hidden
              className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#E8593C] mb-1">Arquitectos · Ingenieros · Desarrolladores · Constructores</p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Círculo de Profesionales Samaco</h2>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">Precios profesionales, eventos en Mendoza y San Juan y un asesor dedicado para tus obras.</p>
            </div>
          </div>
          <button onClick={() => navigateTo('profesionales')}
            className="shrink-0 bg-white text-[#0d2a4d] hover:bg-slate-100 font-black py-3.5 px-7 rounded-2xl text-sm transition-colors inline-flex items-center gap-2">
            Conocer el Círculo <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── WHY SAMACO ── */}
      <section className="py-14">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <h2 className="text-2xl md:text-3xl font-black text-center text-slate-800 mb-10">
            ¿Por qué elegir <span className="text-[#1B4F8C]">Samaco</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_SAMACO.map((item, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                </div>
                <h3 className="font-black text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENT METHODS ── */}
      <section className="bg-white py-14 border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-8">Medios de pago</h2>
          <CarruselMediosPago />
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section className="py-14 border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Marcas líderes</p>
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
            {BRANDS_LIST.map(brand => (
              <div key={brand} className="bg-white border border-slate-100 hover:border-[#1B4F8C] rounded-xl px-5 py-3 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <span className="font-black text-slate-400 group-hover:text-[#1B4F8C] text-sm transition-colors">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#1B4F8C] py-14">
        <div className="container mx-auto px-4 max-w-3xl text-center text-white">
          <Zap className="w-10 h-10 mx-auto mb-4 text-[#E8593C]" />
          <h2 className="text-2xl md:text-3xl font-black mb-3">¿Necesitás asesoramiento especializado?</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">Nuestros expertos te ayudan a elegir los mejores materiales para tu obra. Respondemos en minutos.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="https://wa.me/5492615555555" target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe58] text-white font-black py-4 px-8 rounded-2xl transition-colors text-sm shadow-xl">
              <Phone className="w-5 h-5" />Chatear por WhatsApp
            </a>
            <button onClick={() => navigateTo('category')}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-colors text-sm border border-white/20">
              Ver catálogo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// CATEGORY VIEW
// ─────────────────────────────────────────────

function CategoryView({ category, ctx }: { category: string; ctx: AppCtx }) {
  const { navigateTo, addToCart, favorites, toggleFavorite, compareList, toggleCompare } = ctx;
  const MAX_PRICE = 700000;

  // Filtros en la URL (?orden=menor-precio&marca=cemix,roca&min=0&max=300000): se pueden compartir y pautar.
  const [params, setParams] = useSearchParams();
  const SORT_TO_URL: Record<string, string> = { price_asc: 'menor-precio', price_desc: 'mayor-precio' };
  const sortBy    = Object.entries(SORT_TO_URL).find(([, v]) => v === params.get('orden'))?.[0] ?? 'relevance';
  const selBrands = params.get('marca')?.split(',').filter(Boolean) ?? [];
  const priceMin  = Number(params.get('min')) || 0;
  const priceMax  = Number(params.get('max')) || MAX_PRICE;

  const setParam = (key: string, value: string | null) => setParams(prev => {
    const next = new URLSearchParams(prev);
    if (value === null || value === '') next.delete(key); else next.set(key, value);
    return next;
  }, { replace: true });
  const setSortBy   = (v: string) => setParam('orden', SORT_TO_URL[v] ?? null);
  const setPriceMin = (v: number) => setParam('min', v > 0 ? String(v) : null);
  const setPriceMax = (v: number) => setParam('max', v < MAX_PRICE ? String(v) : null);
  const setSelBrands = (update: string[] | ((prev: string[]) => string[])) => {
    const list = typeof update === 'function' ? update(selBrands) : update;
    setParam('marca', list.join(','));
  };

  const [selFinishes, setSelFinishes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useCategories();
  const { data: categoryProducts, loading } = useProducts({ category: category || undefined });
  const catData = aplanarCategorias(categories).find(c => c.name === category)
    ?? { id: '', name: category || 'Catálogo', icon: '', image: '', description: '' };
  const parentCat = catData.parentId ? categories.find(c => c.id === catData.parentId) : undefined;

  let products = categoryProducts;
  if (selBrands.length) products = products.filter(p => selBrands.includes(p.brand));
  products = products.filter(p => p.cashPrice >= priceMin && p.cashPrice <= priceMax);
  if (sortBy === 'price_asc')  products = [...products].sort((a,b) => a.cashPrice - b.cashPrice);
  if (sortBy === 'price_desc') products = [...products].sort((a,b) => b.cashPrice - a.cashPrice);

  const allBrands = [...new Set(categoryProducts.map(p => p.brand))];
  const clearFilters = () => { setParams(new URLSearchParams(), { replace: true }); setSelFinishes([]); };

  // Elemento (no componente): si fuera un componente definido acá se remontaría en cada render y cortaría el arrastre del slider.
  const filtersContent = (
    <div className="space-y-8">
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Ordenar por</h3>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#1B4F8C] transition-colors cursor-pointer">
          <option value="relevance">Más relevantes</option>
          <option value="price_asc">Menor precio</option>
          <option value="price_desc">Mayor precio</option>
        </select>
      </div>
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Rango de precio</h3>
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 text-center">{fmt(priceMin)}</div>
          <span className="text-slate-400 self-center text-sm">—</span>
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 text-center">{fmt(priceMax)}</div>
        </div>
        <div className="dual-range-wrap">
          <div className="dual-range-fill" style={{ left: `${(priceMin/MAX_PRICE)*100}%`, right: `${100-(priceMax/MAX_PRICE)*100}%` }} />
          <input type="range" min={0} max={MAX_PRICE} step={5000} value={priceMin}
            onChange={e => { const v = +e.target.value; if (v < priceMax - 5000) setPriceMin(v); }}
            style={{ zIndex: priceMin > MAX_PRICE * 0.9 ? 5 : 3 }}
          />
          <input type="range" min={0} max={MAX_PRICE} step={5000} value={priceMax}
            onChange={e => { const v = +e.target.value; if (v > priceMin + 5000) setPriceMax(v); }}
            style={{ zIndex: 4 }}
          />
        </div>
      </div>
      {allBrands.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Marca</h3>
          <div className="space-y-2.5">
            {allBrands.map(b => {
              const checked = selBrands.includes(b);
              return (
                <label key={b} className="flex items-center gap-3 cursor-pointer group">
                  <div onClick={() => setSelBrands(prev => checked ? prev.filter(x => x !== b) : [...prev, b])}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0
                      ${checked ? 'bg-[#1B4F8C] border-[#1B4F8C]' : 'border-slate-300 group-hover:border-[#1B4F8C]'}`}>
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${checked ? 'text-[#1B4F8C]' : 'text-slate-600 group-hover:text-slate-900'}`}>{b}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Acabado</h3>
        <div className="flex flex-wrap gap-2">
          {['Cromo', 'Negro Mate', 'Cobre', 'Dorado', 'Blanco'].map(f => (
            <button key={f} onClick={() => setSelFinishes(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all
                ${selFinishes.includes(f) ? 'bg-[#1B4F8C] border-[#1B4F8C] text-white' : 'border-slate-200 text-slate-600 hover:border-[#1B4F8C]'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <button onClick={clearFilters}
        className="w-full py-2.5 border-2 border-slate-200 hover:border-[#E8593C] hover:text-[#E8593C] text-slate-500 font-bold text-sm rounded-xl transition-all">
        Limpiar filtros
      </button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Hero */}
      <section className="relative h-52 md:h-64 overflow-hidden bg-slate-900 flex items-center">
        <div className="absolute inset-0">
          {catData.image && <img src={catData.image} alt={catData.name} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-40" />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B4F8C]/90 to-[#1B4F8C]/40" />
        </div>
        <div className="relative z-10 container mx-auto px-6 md:px-8 max-w-7xl text-white">
          <nav aria-label="Migas de pan" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-70 mb-4">
            <button onClick={() => navigateTo('home')} className="hover:opacity-100 transition-opacity">Inicio</button>
            {parentCat && (
              <><ChevronRight className="w-3 h-3" />
              <button onClick={() => navigateTo('category', undefined, parentCat.name)} className="hover:opacity-100 transition-opacity">{parentCat.name}</button></>
            )}
            <ChevronRight className="w-3 h-3" /><span className="opacity-100">{catData.name}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{catData.name}</h1>
          <p className="text-slate-200 text-sm mt-2 max-w-md">{catData.description}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-10">
        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <p className="text-sm font-bold text-slate-600"><span className="text-[#1B4F8C] font-black">{products.length}</span> productos</p>
          <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 bg-[#1B4F8C] text-white px-4 py-2.5 rounded-xl text-xs font-bold">
            Filtros y orden
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar desktop */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-24">{filtersContent}</div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-5 py-4 mb-6 shadow-sm">
              <p className="text-sm text-slate-600"><span className="font-black text-slate-800">{products.length}</span> productos encontrados</p>
              <div className="hidden md:flex items-center gap-3">
                <span className="text-slate-500 text-sm font-medium">Ordenar:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                  <option value="relevance">Más relevantes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4"><ProductGridSkeleton count={6} /></div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <ProductCard key={p.id} product={p}
                    onClick={() => navigateTo('product', p)} onAddToCart={addToCart}
                    isFavorite={favorites.has(p.id)} onToggleFavorite={toggleFavorite}
                    isComparing={compareList.includes(p.id)} onToggleCompare={toggleCompare} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg">Sin resultados con esos filtros</p>
                <button onClick={clearFilters} className="mt-4 text-sm font-bold text-[#1B4F8C] hover:underline">Limpiar filtros</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[200]" onClick={() => setShowFilters(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[201] max-h-[88vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                <h3 className="font-black text-slate-800">Filtros</h3>
                <button onClick={() => setShowFilters(false)} aria-label="Cerrar filtros"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-5">{filtersContent}</div>
              <div className="p-5 border-t border-slate-100 shrink-0">
                <button onClick={() => setShowFilters(false)} className="w-full py-4 bg-[#1B4F8C] text-white font-black rounded-2xl text-sm">
                  Ver {products.length} productos
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// PRODUCT DETAIL VIEW
// ─────────────────────────────────────────────

interface DetailProps {
  product: Product;
  ctx: AppCtx;
  quantity: number;
  setQuantity: (n: number) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

function ProductDetailView({ product, ctx, quantity, setQuantity, activeTab, setActiveTab }: DetailProps) {
  const { navigateTo, addToCart, favorites, toggleFavorite, compareList, toggleCompare } = ctx;

  // Galería con las fotos reales del producto (en Shopify, las que carga el equipo). Si hay una sola, sin miniaturas.
  const images = product.images?.length ? product.images : [product.image];
  const [activeImg, setActiveImg] = useState(0);
  const imgActual = images[Math.min(activeImg, images.length - 1)];

  const { data: sameCategory } = useProducts({ category: product.category, limit: 5 });
  const related = sameCategory.filter(p => p.id !== product.id).slice(0, 4);

  const descripcionHtml = useMemo(() => (product.descriptionHtml ? limpiarHtml(product.descriptionHtml) : ''), [product.descriptionHtml]);
  const tieneDescripcion = Boolean(descripcionHtml || product.description?.trim() || product.features.length);

  // Especificaciones: los datos que siempre existen + las cargadas en Shopify (metafield samaco.especificaciones).
  const specs: { label: string; value: string }[] = [
    { label: 'Marca', value: product.brand },
    { label: 'Código', value: product.sku },
    ...(product.category ? [{ label: 'Categoría', value: product.category }] : []),
    ...(product.specs ?? []),
  ].filter(s => s.value);

  const waConsulta = `https://wa.me/5492615555555?text=${encodeURIComponent(`Hola Samaco! Quiero consultar por: ${product.name} (código ${product.sku}).`)}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-8">

        {/* Breadcrumb */}
        <nav aria-label="Migas de pan" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button onClick={() => navigateTo('home')} className="hover:text-[#1B4F8C] transition-colors shrink-0">Inicio</button>
          {product.category && <>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <button onClick={() => navigateTo('category', undefined, product.category)} className="hover:text-[#1B4F8C] transition-colors shrink-0">{product.category}</button>
          </>}
          {product.subcategory && <><ChevronRight className="w-3 h-3 shrink-0" /><span className="text-slate-500 shrink-0">{product.subcategory}</span></>}
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-slate-700 truncate">{product.name}</span>
        </nav>

        {/* Main card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Gallery */}
            <div className="p-6 md:p-10 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-100">
              <div className="relative aspect-square max-h-[440px] flex items-center justify-center bg-white rounded-2xl overflow-hidden mb-4 group">
                <img src={imgActual} alt={product.name} referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain p-8 transition-transform duration-500 group-hover:scale-105" />
                {product.discount && (
                  <span className="absolute top-3 left-3 bg-[#E8593C] text-white text-xs font-black px-2.5 py-1 rounded-full">{product.discount}% OFF</span>
                )}
                {images.length > 1 && <>
                  <button aria-label="Foto anterior" onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-600 hover:text-[#1B4F8C]">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button aria-label="Foto siguiente" onClick={() => setActiveImg(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-600 hover:text-[#1B4F8C]">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {images.map((img, i) => (
                    <button key={img + i} onClick={() => setActiveImg(i)} aria-label={`Ver foto ${i + 1}`} aria-current={activeImg === i}
                      className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 bg-white transition-all ${activeImg === i ? 'border-[#1B4F8C] ring-2 ring-[#1B4F8C]/20' : 'border-slate-200 hover:border-slate-400'}`}>
                      <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain p-1.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="p-6 md:p-10 flex flex-col">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {product.brand && <span className="bg-[#1B4F8C]/10 text-[#1B4F8C] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{product.brand}</span>}
                {product.isNew && <span className="bg-[#E8593C]/10 text-[#E8593C] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Nuevo</span>}
                <StockBadge status={product.stockStatus} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight mb-3">{product.name}</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Código: {product.sku}</p>

              {/* Price box */}
              <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{product.installments} cuotas sin interés</p>
                    <p className="text-3xl font-black text-[#E8593C] leading-none">
                      {fmt(product.installmentPrice ?? 0)}<span className="text-sm font-normal text-slate-400 ml-1">/ cuota</span>
                    </p>
                  </div>
                  {/* CSS tooltip */}
                  <div className="price-tooltip">
                    <button aria-label="Info sobre precios"
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-[#1B4F8C] hover:text-white hover:border-[#1B4F8C] transition-all">
                      <Info className="w-4 h-4" />
                    </button>
                    <div className="price-tooltip-content">
                      <p className="font-bold mb-2">💳 ¿Cómo se calculan los precios?</p>
                      <p className="mb-1.5"><strong>En cuotas:</strong> 9 cuotas sin interés con BNA+, Visa, Mastercard o Naranja X Visa.</p>
                      <p className="mb-1.5"><strong>Transferencia −15%:</strong> precio final pagando con transferencia bancaria en la web (débito o crédito en 1 pago: −10%).</p>
                      <p><strong>Precio de lista:</strong> precio de referencia sin descuentos aplicados.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5 border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">Transferencia bancaria</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-emerald-600">{fmt(product.cashPrice)}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">−15%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Precio de lista</span>
                    <span className="text-sm text-slate-400 line-through">{fmt(product.listPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Quantity + cart */}
              <div className="flex gap-3 mb-4">
                <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Reducir cantidad"
                    className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-10 text-center font-black text-slate-800" aria-live="polite">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} aria-label="Aumentar cantidad"
                    className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <button onClick={() => addToCart(product, quantity)}
                  disabled={product.stockStatus === 'out_of_stock'}
                  className="flex-1 h-12 bg-[#E8593C] hover:bg-[#d14a2f] disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 text-sm">
                  <ShoppingCart className="w-5 h-5" />{product.stockStatus === 'out_of_stock' ? 'Sin stock' : 'Agregar al carrito'}
                </button>
              </div>

              {/* Secondary actions */}
              <div className="flex gap-3 mb-6">
                <button onClick={() => toggleFavorite(product.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded-xl text-sm font-bold transition-all
                    ${favorites.has(product.id) ? 'border-[#E8593C] text-[#E8593C] bg-red-50' : 'border-slate-200 text-slate-600 hover:border-[#E8593C] hover:text-[#E8593C]'}`}>
                  <Heart className={`w-4 h-4 ${favorites.has(product.id) ? 'fill-[#E8593C]' : ''}`} />
                  {favorites.has(product.id) ? 'Guardado' : 'Guardar'}
                </button>
                <a href={waConsulta} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
                  <Phone className="w-4 h-4" />{product.stockStatus === 'out_of_stock' ? 'Consultar disponibilidad' : 'Consultar'}
                </a>
              </div>

              {/* Perks */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                {([
                  [Truck,   'Entrega en obra',     'Flota propia'],
                  [MapPin,  'Retiro en sucursal',  'Elegilo al pagar'],
                  [Shield,  'Garantía oficial',    'Del fabricante'],
                  [Package, 'Stock real',          'En sucursales'],
                ] as const).map(([Icon, title, sub]) => (
                  <div key={title} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#1B4F8C]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700 leading-tight">{title}</p>
                      <p className="text-[10px] text-slate-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="border-t border-slate-100">
            <div role="tablist" className="flex overflow-x-auto no-scrollbar border-b border-slate-100">
              {([
                ['detalles',         'Descripción'],
                ['especificaciones', 'Especificaciones'],
              ] as const).map(([key, label]) => (
                <button key={key} role="tab" aria-selected={activeTab === key} onClick={() => setActiveTab(key)}
                  className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap
                    ${activeTab === key ? 'border-[#1B4F8C] text-[#1B4F8C]' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6 md:p-10">
              {/* Descripción: HTML de Shopify (limpio) o texto plano; si no hay nada, invitación a consultar */}
              {activeTab !== 'especificaciones' && (
                <div className="max-w-2xl">
                  {descripcionHtml
                    ? <div className="descripcion-producto text-slate-600 leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: descripcionHtml }} />
                    : product.description?.trim() && <p className="text-slate-600 leading-relaxed mb-8 whitespace-pre-line">{product.description}</p>}
                  {product.features.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-sm text-slate-700 font-medium">{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!tieneDescripcion && (
                    <p className="text-sm text-slate-500">
                      Estamos completando la información de este producto. ¿Tenés dudas?{' '}
                      <a href={waConsulta} target="_blank" rel="noreferrer" className="font-bold text-[#1B4F8C] hover:underline">Consultanos por WhatsApp</a>.
                    </p>
                  )}
                </div>
              )}

              {/* Especificaciones: solo datos reales */}
              {activeTab === 'especificaciones' && (
                <div className="max-w-xl">
                  {specs.map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center gap-6 py-3.5 border-b border-slate-100 last:border-none">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                      <span className="text-sm font-semibold text-slate-700 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-slate-800 mb-6">También te puede interesar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(p => (
                <ProductCard key={p.id} product={p}
                  onClick={() => navigateTo('product', p)}
                  onAddToCart={addToCart} isFavorite={favorites.has(p.id)} onToggleFavorite={toggleFavorite}
                  isComparing={compareList.includes(p.id)} onToggleCompare={toggleCompare} />
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// CALCULADORA VIEW
// ─────────────────────────────────────────────

function CalculadoraView({ ctx }: { ctx: AppCtx }) {
  const { navigateTo } = ctx;
  type CalcId = 'hormigon' | 'revoque' | 'pintura' | 'pisos' | 'hierro';
  const [activeCalc, setActiveCalc] = useState<CalcId>('hormigon');
  const [hLargo,   setHLargo]   = useState(5);
  const [hAncho,   setHAncho]   = useState(5);
  const [hEspesor, setHEspesor] = useState(10);
  const [rSuperficie, setRSuperficie] = useState(50);
  const [rEspesor,    setREspesor]    = useState(15);
  const [pSuperficie, setPSuperficie] = useState(80);
  const [pManos,      setPManos]      = useState(2);
  const [pisoM2,      setPisoM2]      = useState(30);
  const [pisoDesperc, setPisoDesperc] = useState(10);
  const [hierroMetros,   setHierroMetros]   = useState(50);
  const [hierroDiametro, setHierroDiametro] = useState(12);

  const resHormigon = (() => {
    const vol = hLargo * hAncho * (hEspesor / 100);
    return { volumen: vol.toFixed(2), cemento: Math.ceil(vol * 7), arena: (vol * 0.5).toFixed(2), piedra: (vol * 0.7).toFixed(2) };
  })();
  const resRevoque  = { bolsas: Math.ceil(rSuperficie * (rEspesor / 15) / 18 * 1.15) };
  const resPintura  = (() => {
    const litros = (pSuperficie * pManos) / 4;
    return { baldes: Math.ceil(litros / 20), litros: litros.toFixed(1), fijador: Math.ceil(pSuperficie / 50) };
  })();
  const resPisos  = { m2Total: (pisoM2 * (1 + pisoDesperc / 100)).toFixed(2) };
  const resHierro = (() => {
    const kgPorMetro = (hierroDiametro ** 2) * 0.00617;
    return { barras: Math.ceil(hierroMetros / 12), kgTotal: (hierroMetros * kgPorMetro).toFixed(1), kgPorMetro: kgPorMetro.toFixed(3) };
  })();

  const calcs = [
    { id: 'hormigon' as CalcId, label: 'Hormigón', icon: '🏗️' },
    { id: 'revoque'  as CalcId, label: 'Revoque',  icon: '🧱' },
    { id: 'pintura'  as CalcId, label: 'Pintura',  icon: '🎨' },
    { id: 'pisos'    as CalcId, label: 'Pisos',    icon: '⬜' },
    { id: 'hierro'   as CalcId, label: 'Hierro',   icon: '🔩' },
  ];

  const Slider = ({ label, val, set, unit, min, max, step }: { label: string; val: number; set: (n:number)=>void; unit: string; min: number; max: number; step: number }) => (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
        <span className="text-sm font-black text-[#1B4F8C]">{val} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(+e.target.value)} className="w-full accent-[#1B4F8C]" />
      <div className="flex justify-between text-[10px] text-slate-300 mt-0.5"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );

  const categoryForCalc = activeCalc === 'hierro' || activeCalc === 'hormigon' || activeCalc === 'revoque' ? 'Obra Gruesa' : activeCalc === 'pintura' ? 'Pinturas' : 'Pisos y Revestimientos';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <section className="bg-gradient-to-br from-[#0d2a4d] to-[#1B4F8C] py-14 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="w-16 h-16 bg-[#E8593C] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">Calculadora de materiales</h1>
          <p className="text-slate-300 max-w-xl mx-auto">Calculá exactamente cuánto material necesitás para tu obra. Sin desperdicios, sin faltantes.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-4xl py-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1">
          {calcs.map(c => (
            <button key={c.id} onClick={() => setActiveCalc(c.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shrink-0
                ${activeCalc === c.id ? 'bg-[#1B4F8C] text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:border-[#1B4F8C]'}`}>
              <span>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs panel */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-5">
            <h2 className="font-black text-slate-800 text-xl">
              {calcs.find(c => c.id === activeCalc)?.icon}{' '}
              {{hormigon:'Hormigón / Contrapiso', revoque:'Revoque / Mortero', pintura:'Pintura Exterior', pisos:'Pisos y Cerámicas', hierro:'Hierro Corrugado'}[activeCalc]}
            </h2>
            <p className="text-xs text-slate-500 bg-blue-50 px-3 py-2 rounded-lg">
              {{
                hormigon: 'Para hormigón H-21 (losas, contrapisos, columnas)',
                revoque:  'Basado en Weber Pro 30kg · Incluye 15% de desperdicio',
                pintura:  'Basado en Látex Tersuave 20L · 80m²/balde por mano',
                pisos:    'Incluye desperdicio por cortes y roturas',
                hierro:   'Fórmula estándar IRAM · Barras de 12m',
              }[activeCalc]}
            </p>
            {activeCalc === 'hormigon' && <>
              <Slider label="Largo"   val={hLargo}   set={setHLargo}   unit="m"  min={0.5} max={50} step={0.5} />
              <Slider label="Ancho"   val={hAncho}   set={setHAncho}   unit="m"  min={0.5} max={50} step={0.5} />
              <Slider label="Espesor" val={hEspesor} set={setHEspesor} unit="cm" min={5}   max={30} step={1}   />
            </>}
            {activeCalc === 'revoque' && <>
              <Slider label="Superficie" val={rSuperficie} set={setRSuperficie} unit="m²" min={5}  max={500} step={5} />
              <Slider label="Espesor"    val={rEspesor}    set={setREspesor}    unit="mm" min={8}  max={25}  step={1} />
            </>}
            {activeCalc === 'pintura' && <>
              <Slider label="Superficie" val={pSuperficie} set={setPSuperficie} unit="m²"    min={10} max={500} step={10} />
              <Slider label="Manos"      val={pManos}      set={setPManos}      unit="manos" min={1}  max={3}   step={1}  />
            </>}
            {activeCalc === 'pisos' && <>
              <Slider label="Superficie del ambiente" val={pisoM2}      set={setPisoM2}      unit="m²" min={1}  max={300} step={1} />
              <Slider label="Desperdicio"             val={pisoDesperc} set={setPisoDesperc} unit="%"  min={5}  max={20}  step={1} />
            </>}
            {activeCalc === 'hierro' && <>
              <Slider label="Metros lineales" val={hierroMetros} set={setHierroMetros} unit="m" min={10} max={500} step={10} />
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Diámetro</p>
                <div className="flex flex-wrap gap-2">
                  {[8,10,12,14,16].map(d => (
                    <button key={d} onClick={() => setHierroDiametro(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all
                        ${hierroDiametro === d ? 'bg-[#1B4F8C] border-[#1B4F8C] text-white' : 'border-slate-200 text-slate-600 hover:border-[#1B4F8C]'}`}>
                      Ø{d}mm
                    </button>
                  ))}
                </div>
              </div>
            </>}
          </div>

          {/* Results panel */}
          <div className="bg-gradient-to-br from-[#1B4F8C] to-[#0d2a4d] rounded-3xl shadow-xl p-8 text-white flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Resultado estimado</p>
              <h3 className="text-xl font-black mb-6">Lo que necesitás comprar</h3>
              <div className="space-y-3">
                {activeCalc === 'hormigon' && <>
                  <p className="text-xs text-blue-200 opacity-80 mb-4">Volumen total: {resHormigon.volumen} m³</p>
                  {[
                    { label:'Cemento Portland 50kg', value:`${resHormigon.cemento} bolsas`, hi: true  },
                    { label:'Arena gruesa',          value:`${resHormigon.arena} m³`,       hi: false },
                    { label:'Piedra / Canto rodado', value:`${resHormigon.piedra} m³`,      hi: false },
                  ].map(({ label, value, hi }) => (
                    <div key={label} className={`flex justify-between items-center p-3 rounded-xl ${hi ? 'bg-white/20' : 'bg-white/10'}`}>
                      <span className="text-sm">{label}</span>
                      <span className={`font-black text-lg ${hi ? 'text-[#E8593C]' : ''}`}>{value}</span>
                    </div>
                  ))}
                </>}
                {activeCalc === 'revoque' && (
                  <div className="flex justify-between items-center p-4 rounded-xl bg-white/20">
                    <span className="text-sm">Weber Pro Revoque 30kg</span>
                    <span className="font-black text-3xl text-[#E8593C]">{resRevoque.bolsas} <span className="text-base">bolsas</span></span>
                  </div>
                )}
                {activeCalc === 'pintura' && <>
                  {[
                    { label:'Látex Exterior Tersuave 20L', value:`${resPintura.baldes} baldes`, hi: true  },
                    { label:'Fijador Consolidante 4L',     value:`${resPintura.fijador} latas`, hi: false },
                  ].map(({ label, value, hi }) => (
                    <div key={label} className={`flex justify-between items-center p-3 rounded-xl ${hi ? 'bg-white/20' : 'bg-white/10'}`}>
                      <span className="text-sm">{label}</span>
                      <span className={`font-black text-xl ${hi ? 'text-[#E8593C]' : ''}`}>{value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-blue-200 opacity-70">Total: {resPintura.litros} litros de pintura</p>
                </>}
                {activeCalc === 'pisos' && (
                  <div className="flex justify-between items-center p-4 rounded-xl bg-white/20">
                    <span className="text-sm">m² a comprar (con {pisoDesperc}% desperdicio)</span>
                    <span className="font-black text-3xl text-[#E8593C]">{resPisos.m2Total} <span className="text-base">m²</span></span>
                  </div>
                )}
                {activeCalc === 'hierro' && <>
                  {[
                    { label:`Barras Ø${hierroDiametro}mm x12m`, value:`${resHierro.barras} barras`, hi: true  },
                    { label:'Peso total',                        value:`${resHierro.kgTotal} kg`,    hi: false },
                    { label:'Peso/metro lineal',                 value:`${resHierro.kgPorMetro} kg`, hi: false },
                  ].map(({ label, value, hi }) => (
                    <div key={label} className={`flex justify-between items-center p-3 rounded-xl ${hi ? 'bg-white/20' : 'bg-white/10'}`}>
                      <span className="text-sm">{label}</span>
                      <span className={`font-black text-xl ${hi ? 'text-[#E8593C]' : ''}`}>{value}</span>
                    </div>
                  ))}
                </>}
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <button onClick={() => navigateTo('category', undefined, categoryForCalc)}
                className="w-full py-3.5 bg-[#E8593C] hover:bg-[#d14a2f] text-white font-black rounded-xl transition-colors text-sm">
                Ver productos relacionados →
              </button>
              <p className="text-[10px] text-center text-blue-300 opacity-60">* Valores estimativos. Consultá con un técnico para cantidades exactas.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// SUCURSALES VIEW
// ─────────────────────────────────────────────

function SucursalesView({ ctx }: { ctx: AppCtx }) {
  const { navigateTo } = ctx;
  const [activeId, setActiveId] = useState('central');
  const active = SUCURSALES.find(s => s.id === activeId)!;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <section className="bg-gradient-to-br from-[#0d2a4d] to-[#1B4F8C] py-14 text-white">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <MapPin className="w-12 h-12 text-[#E8593C] mx-auto mb-5" />
          <h1 className="text-3xl md:text-4xl font-black mb-3">Nuestras sucursales</h1>
          <p className="text-slate-300 max-w-xl mx-auto">4 puntos de venta en Mendoza. Visitanos, llamanos o escribinos por WhatsApp.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 max-w-6xl py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {SUCURSALES.map(s => (
            <button key={s.id} onClick={() => setActiveId(s.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all
                ${activeId === s.id ? 'border-[#1B4F8C] bg-[#1B4F8C]/5 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'}`}>
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl text-white mb-3`}>{s.icon}</div>
              <p className={`font-black text-sm ${activeId === s.id ? 'text-[#1B4F8C]' : 'text-slate-800'}`}>{s.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.address.split(',')[0]}</p>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 ${active.color} rounded-2xl flex items-center justify-center text-2xl text-white`}>{active.icon}</div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">{active.name}</h2>
                    <p className="text-sm text-slate-500">{active.address}</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  {([['Dirección', active.address, MapPin], ['Teléfono', active.phone, Phone], ['Horarios', active.hours, Clock], ['Email', active.email, Mail]] as const).map(([label, value, Icon]) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-[#1B4F8C]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
                        <p className="text-sm text-slate-700 font-medium">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">{active.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {active.features.map(f => (
                    <div key={f} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={active.mapUrl} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1B4F8C] hover:bg-[#163f70] text-white font-bold py-3 px-5 rounded-xl text-sm transition-colors">
                    <Navigation className="w-4 h-4" />Cómo llegar
                  </a>
                  <a href={`https://wa.me/5492615555555?text=${encodeURIComponent(`Hola! Me interesa visitar ${active.name}. ¿Podría darme más información?`)}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe58] text-white font-bold py-3 px-5 rounded-xl text-sm transition-colors">
                    <Phone className="w-4 h-4" />WhatsApp
                  </a>
                </div>
              </div>
              <div className="bg-slate-100 min-h-64 relative overflow-hidden">
                <iframe
                  title={`Mapa ${active.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(active.address + ', Mendoza, Argentina')}&output=embed&z=15`}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="bg-[#1B4F8C] rounded-3xl p-8 text-center text-white">
          <Truck className="w-10 h-10 text-[#E8593C] mx-auto mb-3" />
          <h3 className="text-xl font-black mb-2">¿Necesitás entrega en obra?</h3>
          <p className="text-slate-300 text-sm mb-6">Entregamos con flota propia en toda Mendoza. Coordiná fecha y horario al comprar.</p>
          <button onClick={() => navigateTo('home')}
            className="bg-[#E8593C] hover:bg-[#d14a2f] text-white font-black py-3 px-8 rounded-xl text-sm transition-colors">
            Ver catálogo completo
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// SEARCH / 404 / PLACEHOLDER
// ─────────────────────────────────────────────

/** Mientras carga una página por URL. Tiene que ser motion.div para AnimatePresence. */
const PagePlaceholder = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="container mx-auto px-4 md:px-8 max-w-7xl py-10 grid grid-cols-2 md:grid-cols-4 gap-4">
    <ProductGridSkeleton count={4} />
  </motion.div>
);

function SearchView({ ctx }: { ctx: AppCtx }) {
  const { navigateTo, addToCart, favorites, toggleFavorite, compareList, toggleCompare } = ctx;
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const { data: results, loading } = useProductSearch(q, 48, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="container mx-auto px-4 md:px-8 max-w-7xl py-10">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Resultados de búsqueda</p>
      <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-8">“{q}”</h1>
      {q.trim().length < 2 ? (
        <p className="text-slate-500">Escribí al menos 2 letras para buscar.</p>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"><ProductGridSkeleton count={8} /></div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <Search className="w-10 h-10 mx-auto mb-4 text-slate-300" />
          <p className="font-bold text-slate-700">No encontramos productos para “{q}”.</p>
          <button onClick={() => navigateTo('category')} className="mt-4 text-sm font-bold text-[#1B4F8C] hover:underline">Ver el catálogo completo</button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-6"><span className="font-black text-slate-800">{results.length}</span> productos</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map(p => (
              <ProductCard key={p.id} product={p}
                onClick={() => navigateTo('product', p)} onAddToCart={addToCart}
                isFavorite={favorites.has(p.id)} onToggleFavorite={toggleFavorite}
                isComparing={compareList.includes(p.id)} onToggleCompare={toggleCompare} />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

function NotFoundView({ ctx }: { ctx: AppCtx }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="container mx-auto px-4 max-w-xl py-24 text-center">
      <p className="text-7xl font-black text-slate-200 mb-4">404</p>
      <h1 className="text-2xl font-black text-slate-800 mb-2">No encontramos esta página</h1>
      <p className="text-slate-500 mb-8">Puede que el producto ya no esté disponible o que el link tenga un error.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => ctx.navigateTo('home')} className="bg-[#1B4F8C] hover:bg-[#163f70] text-white font-bold px-6 py-3 rounded-xl text-sm">Ir al inicio</button>
        <button onClick={() => ctx.navigateTo('category')} className="border-2 border-slate-200 hover:border-[#1B4F8C] text-slate-700 font-bold px-6 py-3 rounded-xl text-sm">Ver catálogo</button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// COMPARADOR MODAL
// ─────────────────────────────────────────────

function ComparadorModal({ isOpen, onClose, products, onAddToCart }: {
  isOpen: boolean; onClose: () => void; products: Product[]; onAddToCart: (p: Product) => void;
}) {
  const specs: { label: string; getValue: (p: Product) => string }[] = [
    { label: 'Precio con transferencia', getValue: p => fmt(p.cashPrice) },
    { label: 'Precio en cuotas',       getValue: p => `${p.installments}x ${fmt(p.installmentPrice ?? 0)}` },
    { label: 'Precio de lista',        getValue: p => fmt(p.listPrice) },
    { label: 'Marca',                  getValue: p => p.brand },
    { label: 'Categoría',              getValue: p => p.category },
    { label: 'SKU',                    getValue: p => p.sku },
    { label: 'Descuento',              getValue: p => p.discount ? `${p.discount}% OFF` : '—' },
    { label: 'Stock',                  getValue: p => ({ in_stock: '✅ Disponible', low_stock: '⚠️ Últimas unidades', out_of_stock: '❌ Sin stock' })[p.stockStatus] },
  ];

  return (
    <AnimatePresence>
      {isOpen && products.length >= 2 && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-4 md:inset-8 bg-white rounded-3xl z-[301] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#1B4F8C]" />Comparar productos
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full min-w-[500px]">
                <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left w-32 text-xs font-black text-slate-400 uppercase tracking-wider">Especificación</th>
                    {products.map(p => (
                      <th key={p.id} className="px-4 py-3 text-center border-l border-slate-100">
                        <img src={p.image} alt={p.name} referrerPolicy="no-referrer" className="w-16 h-16 object-contain mx-auto mb-2 bg-slate-50 rounded-xl p-1" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{p.brand}</p>
                        <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mt-0.5">{p.name}</p>
                        <button onClick={() => { onAddToCart(p); onClose(); }}
                          className="mt-2 w-full py-1.5 bg-[#1B4F8C] text-white text-[10px] font-bold rounded-lg hover:bg-[#163f70] transition-colors">
                          Agregar al carrito
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specs.map((spec, i) => (
                    <tr key={spec.label} className={i % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">{spec.label}</td>
                      {products.map(p => (
                        <td key={p.id} className="px-4 py-3 text-sm font-semibold text-slate-700 text-center border-l border-slate-100">{spec.getValue(p)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const route    = parseRoute(location.pathname);
  const { data: categories, loading: categoriesLoading } = useCategories();
  const allCategories = aplanarCategorias(categories);
  const routeCategory = route.view === 'category' && route.handle ? allCategories.find(c => c.id === route.handle) : undefined;
  const { data: routeProduct, loading: productLoading } = useProductByHandle(route.view === 'product' ? route.handle : undefined);

  const [searchQuery,     setSearchQuery]     = useState('');
  const [showSugg,        setShowSugg]        = useState(false);
  const [cartItems,       setCartItems]       = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('samaco_cart') ?? '[]'); } catch { return []; }
  });
  const [cartOpen,        setCartOpen]        = useState(false);
  const [favorites,       setFavorites]       = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('samaco_favs') ?? '[]')); } catch { return new Set(); }
  });
  const [quantity,        setQuantity]        = useState(1);
  const [activeTab,       setActiveTab]       = useState('detalles');
  const [compareList,     setCompareList]     = useState<string[]>([]);
  const [comparadorOpen,  setComparadorOpen]  = useState(false);
  const { data: compareProducts } = useProductsByIds(compareList);

  // Persistencia localStorage
  useEffect(() => { localStorage.setItem('samaco_cart', JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { localStorage.setItem('samaco_favs', JSON.stringify([...favorites])); }, [favorites]);

  const cartCount = cartItems.reduce((a, i) => a + i.quantity, 0);

  // Cada página tiene su URL; navigateTo traduce vista (+ producto / nombre de categoría) a path.
  const navigateTo = (view: View, product?: Product, category?: string) => {
    let path: string;
    if (view === 'product' && product) {
      path = paths.producto(product.handle ?? slugify(product.name));
    } else if (view === 'category') {
      path = paths.categoria(category ? (allCategories.find(c => c.name === category)?.id ?? slugify(category)) : undefined);
    } else {
      path = VIEW_PATHS[view] ?? paths.home();
    }
    navigate(path);
  };

  // /cps, /Cps… → /CPS: una sola URL oficial para el Círculo (mejor para Analytics y para pautar).
  useEffect(() => {
    const m = location.pathname.match(/^\/cps(?=\/|$)/i);
    if (m && m[0] !== CPS) navigate(CPS + location.pathname.slice(m[0].length) + location.search, { replace: true });
  }, [location.pathname, location.search, navigate]);

  // Al cambiar de página: arriba de todo y ficha de producto reseteada. (Los filtros por query string no cambian el pathname.)
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setActiveTab('detalles');
    setQuantity(1);
    setShowSugg(false);
  }, [location.pathname]);

  // Título de la pestaña por página (también lo usan Analytics y el Pixel).
  useEffect(() => {
    const titles: Partial<Record<Route['view'], string>> = {
      'category':      routeCategory?.name ?? 'Catálogo',
      'product':       routeProduct?.name,
      'search':        'Búsqueda',
      'calculadora':   'Calculadora de materiales',
      'sucursales':    'Sucursales',
      'financiacion':  'Financiación y medios de pago',
      'profesionales': 'Círculo de Profesionales',
      'pro-ingresar':  'Ingresar · Círculo de Profesionales',
      'pro-registro':  'Alta · Círculo de Profesionales',
      'panel':         'Mi panel · Círculo de Profesionales',
      'evento':        'Evento · Círculo de Profesionales',
      'not-found':     'Página no encontrada',
    };
    const t = titles[route.view];
    document.title = t ? `${t} | Samaco` : 'Samaco - Materiales de Construcción | Mendoza';
  }, [route.view, routeCategory?.name, routeProduct?.name]);

  const addToCart = (product: Product, qty = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { product, quantity: qty }];
    });
    setCartOpen(true);
  };

  const updateCartQty = (id: string, qty: number) => {
    if (qty < 1) { setCartItems(prev => prev.filter(i => i.product.id !== id)); return; }
    setCartItems(prev => prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i));
  };

  const toggleFavorite = (id: string) => setFavorites(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleCompare = (id: string) => setCompareList(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 3 ? prev : [...prev, id]
  );



  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSugg(e.target.value.length >= 2);
  };

  const ctx: AppCtx = { navigateTo, addToCart, favorites, toggleFavorite, compareList, toggleCompare };

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#E8593C] selection:text-white">
      <Header
        navigateTo={navigateTo}
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        cartCount={cartCount}
        favCount={favorites.size}
        setCartOpen={setCartOpen}
        showSugg={showSugg}
        setShowSugg={setShowSugg}
      />
      <MiniCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdate={updateCartQty}
        onRemove={id => setCartItems(prev => prev.filter(i => i.product.id !== id))}
        navigateTo={navigateTo}
      />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {route.view === 'home'        && <HomeView        key="home"          ctx={ctx} />}
          {route.view === 'category' && (
            !route.handle                    ? <CategoryView key="cat-all" category="" ctx={ctx} /> :
            routeCategory                    ? <CategoryView key={`cat-${route.handle}`} category={routeCategory.name} ctx={ctx} /> :
            categoriesLoading                ? <PagePlaceholder key="cat-loading" /> :
                                               <NotFoundView key="404" ctx={ctx} />
          )}
          {route.view === 'search'      && <SearchView      key="search"        ctx={ctx} />}
          {route.view === 'calculadora' && <CalculadoraView key="calc"          ctx={ctx} />}
          {route.view === 'sucursales'  && <SucursalesView  key="suc"           ctx={ctx} />}
          {route.view === 'financiacion' && <FinanciacionView key="fin" />}
          {route.view === 'profesionales' && <CirculoView key="circulo" ir={v => navigateTo(v)} />}
          {route.view === 'pro-ingresar'  && <AccesoView  key="acceso"  modo="ingresar" ir={v => navigateTo(v)} />}
          {route.view === 'pro-registro'  && <AccesoView  key="acceso"  modo="registro" ir={v => navigateTo(v)} />}
          {route.view === 'panel'         && <PanelView   key="panel"   tab={route.tab} ir={v => navigateTo(v)} />}
          {route.view === 'evento'        && <EventoView  key={`ev-${route.id}`} id={route.id} ir={v => navigateTo(v)} />}
          {route.view === 'not-found'     && <NotFoundView key="404" ctx={ctx} />}
          {route.view === 'product' && !routeProduct && (
            productLoading ? <PagePlaceholder key="prod-loading" /> : <NotFoundView key="404" ctx={ctx} />
          )}
          {route.view === 'product' && routeProduct && (
            <ProductDetailView
              key={`prod-${routeProduct.id}`}
              product={routeProduct}
              ctx={ctx}
              quantity={quantity}
              setQuantity={setQuantity}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </AnimatePresence>
      </main>
      <Footer navigateTo={navigateTo} />

      {/* Comparador modal */}
      <ComparadorModal
        isOpen={comparadorOpen}
        onClose={() => setComparadorOpen(false)}
        products={compareProducts}
        onAddToCart={addToCart}
      />

      {/* Barra flotante del comparador */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[150] bg-white border-t-2 border-[#1B4F8C] shadow-2xl px-4 py-3">
            <div className="container mx-auto max-w-5xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Layers className="w-5 h-5 text-[#1B4F8C] shrink-0" />
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {compareProducts.map(p => {
                    const id = p.id;
                    return (
                      <div key={id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shrink-0">
                        <img src={p.image} alt="" referrerPolicy="no-referrer" className="w-7 h-7 object-contain" />
                        <span className="text-xs font-semibold text-slate-700 max-w-[80px] truncate">{p.name}</span>
                        <button onClick={() => toggleCompare(id)} className="text-slate-300 hover:text-red-400 ml-0.5"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setCompareList([])} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2">Limpiar</button>
                <button onClick={() => setComparadorOpen(true)} disabled={compareList.length < 2}
                  className="bg-[#1B4F8C] hover:bg-[#163f70] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-colors">
                  Comparar ({compareList.length})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/5492615555555" target="_blank" rel="noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-[99] bg-[#25D366] hover:bg-[#1ebe58] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 border-4 border-white group">
        <Phone className="w-6 h-6 fill-current" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-100 pointer-events-none">
          ¿En qué te ayudamos?
        </span>
      </a>
    </div>
  );
}
