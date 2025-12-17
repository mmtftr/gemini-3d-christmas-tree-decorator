import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { PineTree } from './components/PineTree';
import { OrnamentMesh, GhostOrnament } from './components/Ornaments';
import { EditableOrnament } from './components/EditableOrnament';
import { TreeTopper } from './components/TreeTopper';
import { DecorationPanel } from './components/DecorationPanel';
import { ControlPanel } from './components/ControlPanel';
import { SceneEnvironment } from './components/SceneEnvironment';
import { ChristmasMusicPanel } from './components/ChristmasMusicPanel';
import { CartIcon } from './components/CartIcon';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutForm } from './components/CheckoutForm';
import { OrderConfirmation } from './components/OrderConfirmation';
import { SharePanel } from './components/SharePanel';
import { useTreeStore } from './data/treeStore';
import { useCartStore } from './data/cartStore';
import { useAuth } from './hooks/useAuth';
import { SCENE_THEMES, SceneTheme, DEFAULT_THEME } from './data/themes';
import {
  TREE_PRODUCTS,
  getOrnamentProductByType,
  getTopperProductByType,
} from './data/products';
import {
  OrnamentType,
  TopperType,
  EditorMode,
  TransformMode,
  OrnamentData,
  TreeProduct,
  ShippingAddress,
  Order,
} from './types';
import { ShoppingCart, User, LogOut } from 'lucide-react';

export default function App() {
  // Tree Store (data layer - ready for Convex)
  const store = useTreeStore();

  // Cart Store
  const cartStore = useCartStore();

  // Auth
  const { user, logout, isLoading: authLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<SceneTheme>(DEFAULT_THEME);

  // Local UI State
  const [mode, setMode] = useState<EditorMode>('view');
  const [selectedOrnamentType, setSelectedOrnamentType] = useState<OrnamentType>('sphere');
  const [selectedTopperType, setSelectedTopperType] = useState<TopperType>('star');
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_THEME.ornamentColors[0]);
  const [activePlacement, setActivePlacement] = useState<[number, number, number] | null>(null);

  // Edit mode state
  const [selectedOrnamentId, setSelectedOrnamentId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  // E-commerce state
  const [selectedTreeProduct, setSelectedTreeProduct] = useState<TreeProduct>(TREE_PRODUCTS[1]); // Medium by default
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderConfirmationOpen, setIsOrderConfirmationOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Update tree config when theme changes
  const handleThemeChange = useCallback((theme: SceneTheme) => {
    setCurrentTheme(theme);
    store.updateTreeConfig({
      color: theme.treeColor,
      snowAmount: theme.snowAmount,
    });
    setSelectedColor(theme.ornamentColors[0]);
  }, [store]);

  // Calculate tree top position based on config
  const treeTopY = 1.0 + 4 * (store.treeConfig.height * 0.18) + store.treeConfig.height * 0.25 + 0.3;
  const treeTopPosition: [number, number, number] = [0, treeTopY - 1, 0];

  // Handlers
  const handleTreeHover = useCallback(
    (e: any) => {
      if (mode !== 'decorate') {
        if (activePlacement) setActivePlacement(null);
        return;
      }

      e.stopPropagation();
      const point = e.point;
      const normal = e.face?.normal?.clone()?.transformDirection(e.object.matrixWorld)?.normalize();

      if (!normal) return;

      const pos: [number, number, number] = [
        point.x + normal.x * 0.15,
        point.y + normal.y * 0.15,
        point.z + normal.z * 0.15,
      ];
      setActivePlacement(pos);
    },
    [mode, activePlacement]
  );

  const handleTreeClick = useCallback(
    async (e: any) => {
      if (mode !== 'decorate' || !activePlacement) return;

      e.stopPropagation();

      if (!store.canAddOrnament()) {
        console.warn('Quota exceeded');
        return;
      }

      // Calculate rotation to face camera at time of placement
      const camera = e.camera;
      const dx = camera.position.x - activePlacement[0];
      const dz = camera.position.z - activePlacement[2];
      const rotationY = Math.atan2(dx, dz);

      // Add ornament to tree visualization only (not cart)
      await store.addOrnament({
        type: selectedOrnamentType,
        color: selectedColor,
        position: activePlacement,
        rotation: [0, rotationY, 0] as [number, number, number],
        scale: 1,
      });
    },
    [mode, activePlacement, selectedOrnamentType, selectedColor, store]
  );

  const handleTreeOut = useCallback(() => {
    setActivePlacement(null);
  }, []);

  const handleRemoveOrnament = useCallback(
    async (id: string, e: any) => {
      e.stopPropagation();
      await store.removeOrnament(id);
    },
    [store]
  );

  const handleTopperClick = useCallback(async () => {
    if (mode !== 'topper') return;

    // Add topper to tree visualization only (not cart)
    await store.setTopper({
      type: selectedTopperType,
      color: selectedColor,
      scale: 1.2,
      glow: true,
    });

    setMode('view');
  }, [mode, selectedTopperType, selectedColor, store]);

  // Tree product selection handler - just updates the selection, doesn't add to cart
  const handleSelectTreeProduct = useCallback(
    (product: TreeProduct) => {
      setSelectedTreeProduct(product);
    },
    []
  );

  // Add entire decorated tree to cart (tree + ornaments + topper as a bundle)
  const handleAddToCart = useCallback(async () => {
    // Add tree to cart
    await cartStore.addTreeToCart(selectedTreeProduct);

    // Add all placed ornaments to cart
    for (const ornament of store.ornaments) {
      const ornamentProduct = getOrnamentProductByType(ornament.type);
      if (ornamentProduct) {
        await cartStore.addOrnamentToCart(ornamentProduct, ornament.color, ornament.position);
      }
    }

    // Add topper to cart if present
    if (store.topper) {
      const topperProduct = getTopperProductByType(store.topper.type);
      if (topperProduct) {
        await cartStore.addTopperToCart(topperProduct, store.topper.color);
      }
    }
  }, [selectedTreeProduct, store.ornaments, store.topper, cartStore]);

  // Checkout handler
  const handleCheckout = useCallback(async (address: ShippingAddress) => {
    if (!cartStore.cart) return;

    // Calculate totals
    const shippingCost = cartStore.subtotal >= 50000 ? 0 : 1999;
    const tax = Math.round(cartStore.subtotal * 0.08);
    const total = cartStore.subtotal + shippingCost + tax;

    // Create a mock order (in real app, this would go through Stripe)
    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sessionId: 'local-session',
      cartSnapshot: cartStore.cart,
      shippingAddress: address,
      stripeSessionId: `mock_stripe_${Date.now()}`,
      status: 'paid',
      subtotal: cartStore.subtotal,
      shippingCost,
      tax,
      total,
      treeConfigSnapshot: store.treeConfig,
      ornamentsSnapshot: store.ornaments,
      topperSnapshot: store.topper,
      createdAt: Date.now(),
      paidAt: Date.now(),
    };

    // Clear cart and show confirmation
    await cartStore.clearCart();
    setCompletedOrder(order);
    setIsCheckoutOpen(false);
    setIsOrderConfirmationOpen(true);
  }, [cartStore, store]);

  const handleClearAll = useCallback(async () => {
    await store.clearOrnaments();
    await store.setTopper(null);
  }, [store]);

  // Edit mode handlers
  const handleOrnamentSelect = useCallback((id: string) => {
    setSelectedOrnamentId(id);
  }, []);

  const handleOrnamentDeselect = useCallback(() => {
    setSelectedOrnamentId(null);
  }, []);

  const handleOrnamentUpdate = useCallback(
    async (id: string, updates: Partial<OrnamentData>) => {
      await store.updateOrnament(id, updates);
    },
    [store]
  );

  const handleOrnamentDelete = useCallback(
    async (id: string) => {
      await store.removeOrnament(id);
      setSelectedOrnamentId(null);
    },
    [store]
  );

  // Handle mode change - clear selection when leaving edit mode
  const handleModeChange = useCallback((newMode: EditorMode) => {
    if (newMode !== 'edit') {
      setSelectedOrnamentId(null);
    }
    setMode(newMode);
  }, []);

  return (
    <div className="relative w-full h-screen text-white font-sans select-none overflow-hidden">
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: currentTheme.skyColor }}
      >
        <PerspectiveCamera makeDefault position={[0, 3, 14]} fov={40} />

        {/* Scene Environment (lights, snow, ground, etc.) */}
        <SceneEnvironment theme={currentTheme} />

        {/* Tree */}
        <group position={[0, -2, 0]}>
          <PineTree
            config={store.treeConfig}
            onPointerMove={handleTreeHover}
            onPointerOut={handleTreeOut}
            onClick={handleTreeClick}
          />

          {/* Tree Topper */}
          <TreeTopper
            data={store.topper}
            position={treeTopPosition}
            onClick={handleTopperClick}
            isPlacementMode={mode === 'topper'}
          />
        </group>

        {/* Ornaments */}
        <group>
          {store.ornaments.map((orn) =>
            mode === 'edit' ? (
              <EditableOrnament
                key={orn.id}
                data={orn}
                isSelected={selectedOrnamentId === orn.id}
                editMode={transformMode}
                onSelect={() => handleOrnamentSelect(orn.id)}
                onDeselect={handleOrnamentDeselect}
                onUpdate={(updates) => handleOrnamentUpdate(orn.id, updates)}
                onDelete={() => handleOrnamentDelete(orn.id)}
              />
            ) : (
              <OrnamentMesh
                key={orn.id}
                data={orn}
                onClick={(e) => mode === 'view' && handleRemoveOrnament(orn.id, e)}
              />
            )
          )}

          {/* Ghost Ornament Preview */}
          {mode === 'decorate' && activePlacement && (
            <GhostOrnament
              type={selectedOrnamentType}
              color={selectedColor}
              position={activePlacement}
            />
          )}
        </group>

        <OrbitControls
          makeDefault
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.1}
          enablePan={false}
          minDistance={6}
          maxDistance={25}
          target={[0, 1.5, 0]}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col">
        {/* Top Section */}
        <div className="flex justify-between items-start p-4 md:p-6">
          {/* Left Panel - Theme & Tree Controls */}
          <ControlPanel
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            treeConfig={store.treeConfig}
            onTreeConfigChange={store.updateTreeConfig}
            ornamentCount={store.ornaments.length}
            maxOrnaments={store.currentUser?.quota.maxOrnaments ?? 100}
            selectedTreeProduct={selectedTreeProduct}
            onSelectTreeProduct={handleSelectTreeProduct}
            hasTreeInCart={cartStore.hasTree}
          />

          {/* Right Panel - Auth, Cart & Music */}
          <div className="pointer-events-auto flex flex-col items-end gap-3">
            {/* Auth Button */}
            {!authLoading && (
              <div className="relative">
                {user ? (
                  <>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="
                        flex items-center gap-2
                        bg-white/10 hover:bg-white/20
                        backdrop-blur-md
                        px-3 py-2 rounded-xl
                        text-white text-sm
                        border border-white/10
                        transition-all duration-200
                      "
                    >
                      <User size={18} />
                      <span className="max-w-[100px] truncate">{user.name || user.email}</span>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-sm text-white font-medium truncate">{user.name || 'User'}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                        >
                          <LogOut size={16} />
                          Sign out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="
                        px-4 py-2 rounded-xl
                        bg-white/10 hover:bg-white/20
                        backdrop-blur-md
                        text-white text-sm font-medium
                        border border-white/10
                        transition-all duration-200
                      "
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="
                        px-4 py-2 rounded-xl
                        bg-green-600 hover:bg-green-500
                        text-white text-sm font-medium
                        shadow-lg shadow-green-500/25
                        transition-all duration-200
                      "
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Add to Cart Button - shows when tree is decorated */}
            <button
              onClick={handleAddToCart}
              className="
                flex items-center gap-2
                bg-green-600 hover:bg-green-500
                px-4 py-2.5 rounded-xl
                font-semibold text-white
                shadow-lg shadow-green-500/30
                transition-all duration-200
                hover:scale-105
              "
            >
              <ShoppingCart size={20} />
              <span>Add to Cart</span>
            </button>

            {/* Cart Button */}
            <CartIcon
              itemCount={cartStore.itemCount}
              subtotal={cartStore.subtotal}
              onClick={() => setIsCartOpen(true)}
            />

            {/* Christmas Music Panel */}
            <ChristmasMusicPanel />
          </div>
        </div>

        {/* Share Panel */}
        <SharePanel
          onCopyShareURL={store.copyShareURL}
          onDownloadJSON={store.downloadAsJSON}
          onImportFromCode={store.importFromCode}
          onImportFromData={store.importFromData}
          onSaveToStorage={store.saveToStorage}
          getShareURL={store.getShareURL}
          ornamentCount={store.ornaments.length}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom - Decoration Panel */}
        <DecorationPanel
          mode={mode}
          onModeChange={handleModeChange}
          selectedOrnamentType={selectedOrnamentType}
          onOrnamentTypeChange={setSelectedOrnamentType}
          selectedTopperType={selectedTopperType}
          onTopperTypeChange={setSelectedTopperType}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          onClearAll={handleClearAll}
          ornamentCount={store.ornaments.length}
          maxOrnaments={store.currentUser?.quota.maxOrnaments ?? 100}
          topperSet={!!store.topper}
          transformMode={transformMode}
          onTransformModeChange={setTransformMode}
          selectedOrnamentId={selectedOrnamentId}
          onDeleteSelectedOrnament={() => selectedOrnamentId && handleOrnamentDelete(selectedOrnamentId)}
        />
      </div>

      {/* Welcome Overlay */}
      {!welcomeDismissed && mode === 'view' && store.ornaments.length === 0 && !store.topper && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="pointer-events-auto bg-black/70 backdrop-blur-xl px-8 py-6 rounded-2xl border border-white/10 text-center max-w-md">
            <h2 className="text-xl font-semibold mb-3">Welcome to Tree Shop!</h2>
            <p className="text-sm text-gray-300 mb-4">
              Select a <span className="text-green-400 font-medium">tree size</span> from the left panel,
              then switch to <span className="text-green-400 font-medium">Decorate</span> mode to add ornaments.
            </p>
            <div className="flex justify-center gap-4 text-xs text-gray-500 mb-4">
              <span>🎄 3 Tree Sizes</span>
              <span>•</span>
              <span>6 Ornaments</span>
              <span>•</span>
              <span>2 Toppers</span>
            </div>
            <button
              onClick={() => setWelcomeDismissed(true)}
              className="text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cartStore.cart}
        onUpdateQuantity={cartStore.updateQuantity}
        onRemoveItem={cartStore.removeFromCart}
        onClearCart={cartStore.clearCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Form */}
      {cartStore.cart && (
        <CheckoutForm
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cartStore.cart}
          onSubmit={handleCheckout}
        />
      )}

      {/* Order Confirmation */}
      <OrderConfirmation
        isOpen={isOrderConfirmationOpen}
        onClose={() => {
          setIsOrderConfirmationOpen(false);
          setCompletedOrder(null);
          // Reset for new tree
          store.clearOrnaments();
          store.setTopper(null);
        }}
        order={completedOrder}
      />
    </div>
  );
}
