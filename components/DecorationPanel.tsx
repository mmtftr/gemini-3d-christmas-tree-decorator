import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import {
  OrnamentType,
  OrnamentCategory,
  ORNAMENT_CATEGORIES,
  TopperType,
  EditorMode,
  TransformMode,
  formatPrice,
} from '../types';
import { OrnamentPreview } from './Ornaments';
import { TopperPreview } from './TreeTopper';
import {
  ORNAMENT_PRODUCTS,
  TOPPER_PRODUCTS,
  getOrnamentProductByType,
  getTopperProductByType,
} from '../data/products';
import {
  Sparkles,
  TreeDeciduous,
  Gift,
  Snowflake,
  Heart,
  Star,
  Palette,
  Trash2,
  Crown,
  ChevronDown,
  ChevronUp,
  Move,
  RotateCw,
  MousePointer2,
  Bell,
  Circle,
} from 'lucide-react';

// ============================================
// COLOR PALETTES
// ============================================

export const COLOR_PALETTES = {
  classic: ['#ff0000', '#ffd700', '#008000', '#c0c0c0', '#ffffff'],
  winter: ['#87ceeb', '#b0e0e6', '#ffffff', '#add8e6', '#e0ffff'],
  candy: ['#ff69b4', '#ff1493', '#ffffff', '#ff6b6b', '#ffd93d'],
  royal: ['#4b0082', '#ffd700', '#800020', '#c0c0c0', '#1a1a2e'],
  natural: ['#8b4513', '#228b22', '#daa520', '#f5deb3', '#2e8b57'],
  modern: ['#000000', '#ffffff', '#ff0000', '#ffd700', '#c0c0c0'],
};

export type ColorPalette = keyof typeof COLOR_PALETTES;

// ============================================
// ORNAMENT ICONS
// ============================================

const OrnamentIcon: React.FC<{ type: OrnamentType; className?: string }> = ({
  type,
  className = 'w-5 h-5',
}) => {
  switch (type) {
    case 'sphere':
      return <div className={`${className} rounded-full bg-current`} />;
    case 'cube':
      return <div className={`${className} bg-current`} />;
    case 'diamond':
      return <div className={`${className} rotate-45 bg-current`} />;
    case 'giftBox':
      return <Gift className={className} />;
    case 'snowflake':
      return <Snowflake className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'gift1':
    case 'gift2':
    case 'gift3':
      return <Gift className={className} />;
    case 'ball':
    case 'redball':
      return <Circle className={className} />;
    case 'bell':
      return <Bell className={className} />;
    default:
      return <div className={`${className} rounded-full bg-current`} />;
  }
};

const CategoryIcon: React.FC<{ category: OrnamentCategory; className?: string }> = ({
  category,
  className = 'w-4 h-4',
}) => {
  switch (category) {
    case 'classic':
      return <TreeDeciduous className={className} />;
    case 'shapes':
      return <Sparkles className={className} />;
    case 'festive':
      return <Snowflake className={className} />;
    case 'gifts':
      return <Gift className={className} />;
    default:
      return <Star className={className} />;
  }
};

// ============================================
// 3D PREVIEW COMPONENT
// ============================================

interface PreviewCanvasProps {
  type: OrnamentType | TopperType;
  color: string;
  isTopper?: boolean;
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ type, color, isTopper }) => {
  return (
    <div className="w-full h-32 rounded-lg overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 2]} fov={50} />
        <ambientLight intensity={0.5} />
        <spotLight position={[5, 5, 5]} intensity={1} />
        <Environment preset="city" />
        {isTopper ? (
          <TopperPreview type={type as TopperType} color={color} glow />
        ) : (
          <OrnamentPreview type={type as OrnamentType} color={color} size={2} />
        )}
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={4} />
      </Canvas>
    </div>
  );
};

// ============================================
// QUOTA DISPLAY
// ============================================

interface QuotaDisplayProps {
  used: number;
  max: number;
  label: string;
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ used, max, label }) => {
  const percentage = max === Infinity ? 0 : (used / max) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = used >= max;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className={isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-gray-300'}>
          {used} / {max === Infinity ? '∞' : max}
        </span>
      </div>
      {max !== Infinity && (
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN DECORATION PANEL
// ============================================

interface DecorationPanelProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  selectedOrnamentType: OrnamentType;
  onOrnamentTypeChange: (type: OrnamentType) => void;
  selectedTopperType: TopperType;
  onTopperTypeChange: (type: TopperType) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onClearAll: () => void;
  ornamentCount: number;
  maxOrnaments: number;
  topperSet: boolean;
  // Edit mode props
  transformMode?: TransformMode;
  onTransformModeChange?: (mode: TransformMode) => void;
  selectedOrnamentId?: string | null;
  onDeleteSelectedOrnament?: () => void;
}

export const DecorationPanel: React.FC<DecorationPanelProps> = ({
  mode,
  onModeChange,
  selectedOrnamentType,
  onOrnamentTypeChange,
  selectedTopperType,
  onTopperTypeChange,
  selectedColor,
  onColorChange,
  onClearAll,
  ornamentCount,
  maxOrnaments,
  topperSet,
  transformMode = 'translate',
  onTransformModeChange,
  selectedOrnamentId,
  onDeleteSelectedOrnament,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<OrnamentCategory | null>('classic');
  const [activePalette, setActivePalette] = useState<ColorPalette>('classic');
  const [showPreview, setShowPreview] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const TOPPER_TYPES: TopperType[] = ['star', 'snowflake'];

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none p-4">
      <div className="pointer-events-auto max-w-4xl mx-auto">
        {/* Collapse/Expand Toggle */}
        <div className="flex justify-center mb-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-black/70 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-black/80 transition-all flex items-center gap-1.5"
          >
            {isCollapsed ? (
              <>
                <ChevronUp size={14} />
                Show Panel
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Hide Panel
              </>
            )}
          </button>
        </div>

        {/* Main Panel */}
        <div className={`bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0 border-transparent' : 'max-h-[500px] opacity-100'}`}>
          {/* Mode Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => onModeChange('view')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                mode === 'view'
                  ? 'bg-white/10 text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              View
            </button>
            <button
              onClick={() => onModeChange('decorate')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'decorate'
                  ? 'bg-green-600/30 text-green-300 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TreeDeciduous size={16} />
              Decorate
            </button>
            <button
              onClick={() => onModeChange('edit')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'edit'
                  ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MousePointer2 size={16} />
              Edit
            </button>
            <button
              onClick={() => onModeChange('topper')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'topper'
                  ? 'bg-yellow-600/30 text-yellow-300 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crown size={16} />
              Topper {topperSet && '✓'}
            </button>
          </div>

          {/* Content Area */}
          {mode !== 'view' && (
            <div className="p-4">
              <div className="flex gap-4">
                {/* Left: Selection */}
                <div className="flex-1 space-y-4">
                  {mode === 'decorate' && (
                    <>
                      {/* Ornament Categories */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wide">
                          Ornaments
                        </h3>
                        {(Object.keys(ORNAMENT_CATEGORIES) as OrnamentCategory[]).map((category) => (
                          <div key={category} className="rounded-lg bg-white/5 overflow-hidden">
                            {/* Category Header */}
                            <button
                              onClick={() =>
                                setExpandedCategory(expandedCategory === category ? null : category)
                              }
                              className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <CategoryIcon category={category} />
                                <span className="text-sm font-medium capitalize">{category}</span>
                              </div>
                              {expandedCategory === category ? (
                                <ChevronUp size={16} className="text-gray-400" />
                              ) : (
                                <ChevronDown size={16} className="text-gray-400" />
                              )}
                            </button>

                            {/* Category Items */}
                            {expandedCategory === category && (
                              <div className="px-3 pb-3 grid grid-cols-3 gap-2">
                                {ORNAMENT_CATEGORIES[category].map((type) => {
                                  const isSelected = selectedOrnamentType === type;
                                  const product = getOrnamentProductByType(type);

                                  return (
                                    <button
                                      key={type}
                                      onClick={() => onOrnamentTypeChange(type as OrnamentType)}
                                      className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 ${
                                        isSelected
                                          ? 'bg-green-600/30 ring-2 ring-green-400'
                                          : 'bg-white/5 hover:bg-white/10'
                                      }`}
                                      style={{ color: selectedColor }}
                                      title={product?.name || type}
                                    >
                                      <OrnamentIcon type={type as OrnamentType} className="w-5 h-5" />
                                      <span className="text-[10px] text-gray-400 capitalize">
                                        {type.replace(/([A-Z])/g, ' $1').trim()}
                                      </span>
                                      {product && (
                                        <span className="text-[9px] text-green-400 font-medium">
                                          {formatPrice(product.price.amount)}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {mode === 'topper' && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wide">
                        Tree Toppers
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {TOPPER_TYPES.map((type) => {
                          const product = getTopperProductByType(type);
                          return (
                            <button
                              key={type}
                              onClick={() => onTopperTypeChange(type)}
                              className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 ${
                                selectedTopperType === type
                                  ? 'bg-yellow-600/30 ring-2 ring-yellow-400'
                                  : 'bg-white/5 hover:bg-white/10'
                              }`}
                              style={{ color: selectedColor }}
                            >
                              {type === 'star' && <Star className="w-6 h-6" />}
                              {type === 'snowflake' && <Snowflake className="w-6 h-6" />}
                              <span className="text-[10px] text-gray-400 capitalize">{product?.name || type}</span>
                              {product && (
                                <span className="text-[9px] text-green-400 font-medium">
                                  {formatPrice(product.price.amount)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {mode === 'edit' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wide">
                        Transform Mode
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onTransformModeChange?.('translate')}
                          className={`flex-1 px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                            transformMode === 'translate'
                              ? 'bg-blue-600/30 ring-2 ring-blue-400 text-blue-300'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300'
                          }`}
                        >
                          <Move size={18} />
                          Move
                        </button>
                        <button
                          onClick={() => onTransformModeChange?.('rotate')}
                          className={`flex-1 px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                            transformMode === 'rotate'
                              ? 'bg-blue-600/30 ring-2 ring-blue-400 text-blue-300'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300'
                          }`}
                        >
                          <RotateCw size={18} />
                          Rotate
                        </button>
                      </div>

                      {selectedOrnamentId && (
                        <button
                          onClick={onDeleteSelectedOrnament}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete Selected Ornament
                        </button>
                      )}

                      {!selectedOrnamentId && (
                        <div className="p-4 rounded-lg bg-white/5 text-center text-gray-400 text-sm">
                          Click on an ornament to select it
                        </div>
                      )}
                    </div>
                  )}

                  {/* Color Selection - hide in edit mode */}
                  {mode !== 'edit' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wide">
                          Colors
                        </h3>
                        <select
                          value={activePalette}
                          onChange={(e) => setActivePalette(e.target.value as ColorPalette)}
                          className="text-xs bg-white/10 border border-white/10 rounded px-2 py-1 text-gray-300"
                        >
                          {Object.keys(COLOR_PALETTES).map((palette) => (
                            <option key={palette} value={palette}>
                              {palette.charAt(0).toUpperCase() + palette.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 items-center">
                        {COLOR_PALETTES[activePalette].map((color) => (
                          <button
                            key={color}
                            onClick={() => onColorChange(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                              selectedColor === color
                                ? 'border-white scale-110 ring-2 ring-white/50'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <div className="w-px h-6 bg-white/20" />
                        <label className="relative w-8 h-8 cursor-pointer rounded-full overflow-hidden border-2 border-white/30 flex items-center justify-center hover:border-white transition-colors">
                          <Palette size={14} />
                          <input
                            type="color"
                            value={selectedColor}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="absolute opacity-0 w-full h-full top-0 left-0 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Preview & Quota - hide in edit mode */}
                {mode !== 'edit' && (
                  <div className="w-48 space-y-3">
                    {/* 3D Preview */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wide">
                          Preview
                        </h3>
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className="text-gray-400 hover:text-white"
                        >
                          {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      {showPreview && (
                        <PreviewCanvas
                          type={mode === 'topper' ? selectedTopperType : selectedOrnamentType}
                          color={selectedColor}
                          isTopper={mode === 'topper'}
                        />
                      )}
                    </div>

                    {/* Quota */}
                    <div className="p-3 rounded-lg bg-white/5 space-y-2">
                      <QuotaDisplay
                        used={ornamentCount}
                        max={maxOrnaments}
                        label="Ornaments"
                      />
                    </div>

                    {/* Clear Button */}
                    <button
                      onClick={onClearAll}
                      disabled={ornamentCount === 0}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 size={14} />
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-500 text-center">
                {mode === 'decorate' && 'Click on the tree to place ornaments. Click ornaments to remove.'}
                {mode === 'edit' && 'Click an ornament to select it, then drag the gizmo to move or rotate.'}
                {mode === 'topper' && 'Click the top of the tree to place your topper.'}
              </div>
            </div>
          )}

          {/* Collapsed View Mode */}
          {mode === 'view' && (
            <div className="p-4 text-center text-sm text-gray-400">
              <p>Rotate the tree to view your decorations</p>
              <p className="text-xs mt-1">
                {ornamentCount} ornament{ornamentCount !== 1 && 's'} placed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPACT TOOLBAR (Alternative simpler UI)
// ============================================

interface CompactToolbarProps {
  selectedType: OrnamentType;
  selectedColor: string;
  onTypeChange: (type: OrnamentType) => void;
  onColorChange: (color: string) => void;
  visible: boolean;
}

export const CompactToolbar: React.FC<CompactToolbarProps> = ({
  selectedType,
  selectedColor,
  onTypeChange,
  onColorChange,
  visible,
}) => {
  const quickTypes: OrnamentType[] = ['sphere', 'diamond', 'gift1', 'giftBox', 'snowflake', 'heart'];
  const quickColors = ['#ff0000', '#ffd700', '#c0c0c0', '#1e90ff', '#ff69b4', '#ffffff'];

  return (
    <div
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}
    >
      <div className="bg-black/70 backdrop-blur-xl rounded-full border border-white/10 px-4 py-2 flex items-center gap-3 shadow-lg">
        {/* Types */}
        <div className="flex gap-1">
          {quickTypes.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                selectedType === type
                  ? 'bg-white/20 scale-110'
                  : 'hover:bg-white/10'
              }`}
              style={{ color: selectedColor }}
            >
              <OrnamentIcon type={type} className="w-5 h-5" />
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-white/20" />

        {/* Colors */}
        <div className="flex gap-1">
          {quickColors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                selectedColor === color ? 'border-white scale-125' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
