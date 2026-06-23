import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Clock,
  Code,
  Copy,
  CornerDownLeft,
  Ellipsis,
  ExternalLink,
  Eye,
  File,
  FileText,
  Folder,
  GripVertical,
  Info,
  LayoutGrid,
  List,
  Lock,
  LogOut,
  type LucideIcon,
  Maximize,
  Maximize2,
  Menu,
  Minimize,
  Minimize2,
  Minus,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Pencil,
  Play,
  Plug,
  Plus,
  Pointer,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Square,
  SquarePen,
  Sun,
  Trash2,
  TriangleAlert,
  UserCheck,
  Users,
  Wrench,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { ReactElement, SVGProps } from 'react';
import './icon.css';

/**
 * The product-neutral glyph set. Domain glyphs stay in the product apps; adding
 * one here would break the brand-neutral leaf boundary.
 */
const GLYPHS = {
  search: Search,
  x: X,
  check: Check,
  'check-circle': CheckCircle,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  plus: Plus,
  minus: Minus,
  ellipsis: Ellipsis,
  eye: Eye,
  lock: Lock,
  info: Info,
  alert: CircleAlert,
  'triangle-alert': TriangleAlert,
  refresh: RefreshCw,
  'rotate-ccw': RotateCcw,
  settings: Settings,
  'user-check': UserCheck,
  'external-link': ExternalLink,
  copy: Copy,
  'trash-2': Trash2,
  'panel-left-close': PanelLeftClose,
  'panel-left-open': PanelLeftOpen,
  'log-out': LogOut,
  maximize: Maximize,
  'maximize-2': Maximize2,
  minimize: Minimize,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  list: List,
  'layout-grid': LayoutGrid,
  file: File,
  folder: Folder,
  clock: Clock,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'corner-down-left': CornerDownLeft,
  'grip-vertical': GripVertical,
  pointer: Pointer,
  pencil: Pencil,
  square: Square,
  'square-pen': SquarePen,
  play: Play,
  pause: Pause,
  radio: Radio,
  plug: Plug,
  users: Users,
  wrench: Wrench,
  sun: Sun,
  moon: Moon,
  menu: Menu,
  monitor: Monitor,
  code: Code,
  'file-text': FileText,
  'minimize-2': Minimize2,
  'panel-right-close': PanelRightClose,
  'panel-right-open': PanelRightOpen,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof GLYPHS;

/** Every product-neutral glyph name, in declaration order. */
export const iconNames = Object.keys(GLYPHS) as readonly IconName[];

export type IconSize = 12 | 14 | 16 | 18 | 20 | 32;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'ref'> {
  readonly name: IconName;
  readonly size?: IconSize;
}

export function Icon({ name, size = 16, className, ...rest }: IconProps): ReactElement {
  const Glyph = GLYPHS[name];
  return (
    <Glyph
      aria-hidden="true"
      className={['ui-icon', className].filter(Boolean).join(' ')}
      data-size={size}
      height={size}
      width={size}
      {...rest}
    />
  );
}
