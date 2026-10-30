import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UserRecord {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  user_type: string;
  campus_id?: string;
  is_active: boolean;
}

interface OutletRecord {
  id: number;
  name: string;
  slug: string;
  description: string;
  location: string;
  status: string;
  crowd_level: 'LOW' | 'MODERATE' | 'HIGH';
  avg_wait_min: number;
  available_tables: number;
}

interface MembershipRecord {
  id: number;
  outlet_id: number;
  user_id: number;
  outlet_role: string;
  is_active: boolean;
}

interface CategoryRecord {
  id: number;
  outlet_id: number;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface FoodRecord {
  id: number;
  outlet_id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  prep_minutes: number;
  dietary_type: string;
  is_jain: boolean;
  is_available: boolean;
  available_quantity: number | null;
  is_active: boolean;
  rating?: number;
  is_popular?: boolean;
}

interface OrderRecord {
  id: number;
  order_number: string;
  idempotency_key: string;
  user_id: number;
  outlet_id: number;
  outlet_name: string;
  pickup_counter: string;
  status: string;
  payment_status: string;
  pickup_type: 'immediate' | 'scheduled';
  scheduled_time?: string;
  subtotal: number;
  total: number;
  created_at: string;
  items: Array<{
    food_item_id: number;
    name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>;
}

interface TableRecord {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  location: string;
  reserved_by?: string;
  expires_at?: string;
}

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  timestamp: string;
  type: 'order' | 'pickup' | 'rush' | 'announcement';
  read: boolean;
}

// In-Memory Database initialized with BYTE demo data
const users: UserRecord[] = [
  { id: 1, name: "BYTE Administrator", email: "admin@example.com", password: "ByteAdmin123!", role: "admin", user_type: "staff", campus_id: "DJSCE-ADM-001", is_active: true },
  { id: 2, name: "Dabba Lab Vendor", email: "vendor@example.com", password: "ByteVendor123!", role: "vendor", user_type: "staff", campus_id: "DJSCE-VND-001", is_active: true },
  { id: 3, name: "Tiffin Express Vendor", email: "vendor.tiffin@example.com", password: "ByteVendor123!", role: "vendor", user_type: "staff", campus_id: "DJSCE-VND-002", is_active: true },
  { id: 4, name: "Chai & Crumb Vendor", email: "vendor.chai@example.com", password: "ByteVendor123!", role: "vendor", user_type: "staff", campus_id: "DJSCE-VND-003", is_active: true },
  { id: 5, name: "KEERTHI", email: "student@example.com", password: "ByteStudent123!", role: "user", user_type: "student", campus_id: "DJSCE-2024-CS089", is_active: true },
];

const outlets: OutletRecord[] = [
  { id: 1, name: "Central Canteen", slug: "central-canteen", description: "Everyday comfort meals, fresh tiffin, and live chaat.", location: "Ground Floor · Main Building", status: "active", crowd_level: "MODERATE", avg_wait_min: 12, available_tables: 6 },
  { id: 2, name: "South Indian Corner", slug: "south-indian-corner", description: "Crisp dosas, idlis, vadas & filter coffee.", location: "Food Court · North Wing", status: "active", crowd_level: "LOW", avg_wait_min: 7, available_tables: 4 },
  { id: 3, name: "Beverage & Snack Station", slug: "beverage-station", description: "Cutting chai, cold coffee, sandwiches, and bakery treats.", location: "Library Quadrangle", status: "active", crowd_level: "HIGH", avg_wait_min: 15, available_tables: 2 },
];

const memberships: MembershipRecord[] = [
  { id: 1, outlet_id: 1, user_id: 2, outlet_role: "vendor", is_active: true },
  { id: 2, outlet_id: 2, user_id: 3, outlet_role: "vendor", is_active: true },
  { id: 3, outlet_id: 3, user_id: 4, outlet_role: "vendor", is_active: true },
];

const categories: CategoryRecord[] = [
  { id: 1, outlet_id: 1, name: "Popular", display_order: 1, is_active: true },
  { id: 2, outlet_id: 1, name: "Mains & Meals", display_order: 2, is_active: true },
  { id: 3, outlet_id: 1, name: "Quick Snacks", display_order: 3, is_active: true },
  { id: 4, outlet_id: 2, name: "Breakfast & Tiffin", display_order: 1, is_active: true },
  { id: 5, outlet_id: 2, name: "Combos", display_order: 2, is_active: true },
  { id: 6, outlet_id: 3, name: "Hot & Cold Brews", display_order: 1, is_active: true },
  { id: 7, outlet_id: 3, name: "Bites & Bakery", display_order: 2, is_active: true },
];

// High fidelity food photography assets generated for BYTE
const MASALA_DOSA_IMG = "/src/assets/images/masala_dosa_fisheye_1793394719149.jpg";
const PAV_BHAJI_IMG = "/src/assets/images/pav_bhaji_fisheye_1793394718269.jpg";
const VADA_PAV_IMG = "/src/assets/images/vada_pav_fisheye_1793394718933.jpg";
const PANEER_BUTTER_IMG = "/src/assets/images/paneer_butter_masala_fisheye_1793394718861.jpg";

const foodItems: FoodRecord[] = [
  {
    id: 1,
    outlet_id: 1,
    category_id: 1,
    name: "Mumbai Pav Bhaji",
    description: "Slow-simmered spiced bhaji with melting butter slab, served with buttered toasted pav & fresh chopped onions.",
    price: 80,
    image_url: PAV_BHAJI_IMG,
    prep_minutes: 8,
    dietary_type: "veg",
    is_jain: true,
    is_available: true,
    available_quantity: 45,
    is_active: true,
    rating: 4.9,
    is_popular: true,
  },
  {
    id: 2,
    outlet_id: 1,
    category_id: 1,
    name: "Authentic Mumbai Vada Pav",
    description: "The classic DJSCE campus fuel: Spiced golden batata vada in pav, layered with red garlic chutney & fried chilli.",
    price: 25,
    image_url: VADA_PAV_IMG,
    prep_minutes: 4,
    dietary_type: "veg",
    is_jain: false,
    is_available: true,
    available_quantity: 60,
    is_active: true,
    rating: 4.8,
    is_popular: true,
  },
  {
    id: 3,
    outlet_id: 1,
    category_id: 2,
    name: "Paneer Butter Masala",
    description: "Silky tomato-cashew makhani gravy with tender cottage cheese, fresh cream swirl & warm butter tandoori naan.",
    price: 120,
    image_url: PANEER_BUTTER_IMG,
    prep_minutes: 12,
    dietary_type: "veg",
    is_jain: false,
    is_available: true,
    available_quantity: 30,
    is_active: true,
    rating: 4.9,
    is_popular: true,
  },
  {
    id: 4,
    outlet_id: 1,
    category_id: 2,
    name: "Campus Special Veg Thali",
    description: "Complete student meal: 2 Phulkas, Paneer Subzi, Dal Tadka, Steamed Jeera Rice, Curd & Gulab Jamun.",
    price: 90,
    image_url: PANEER_BUTTER_IMG,
    prep_minutes: 12,
    dietary_type: "veg",
    is_jain: true,
    is_available: true,
    available_quantity: 40,
    is_active: true,
    rating: 4.7,
    is_popular: false,
  },
  {
    id: 5,
    outlet_id: 1,
    category_id: 3,
    name: "Grilled Paneer Wrap",
    description: "Spiced paneer tikka slices with crunchy bell peppers, mint yogurt dressing and pickled onions rolled in flatbread.",
    price: 80,
    image_url: VADA_PAV_IMG,
    prep_minutes: 7,
    dietary_type: "veg",
    is_jain: false,
    is_available: true,
    available_quantity: 25,
    is_active: true,
    rating: 4.6,
    is_popular: false,
  },
  {
    id: 6,
    outlet_id: 2,
    category_id: 4,
    name: "Mysore Masala Dosa",
    description: "Crisp roasted fermented rice crepe smeared with spicy red chutney, stuffed with spiced potato bhaji, served with coconut chutney & sambar.",
    price: 70,
    image_url: MASALA_DOSA_IMG,
    prep_minutes: 10,
    dietary_type: "veg",
    is_jain: true,
    is_available: true,
    available_quantity: 50,
    is_active: true,
    rating: 5.0,
    is_popular: true,
  },
  {
    id: 7,
    outlet_id: 2,
    category_id: 4,
    name: "Steamed Idli Sambar (2 Pcs)",
    description: "Pillow-soft steamed rice & lentil cakes dipped in hot aromatic drumstick sambar with tempered coconut chutney.",
    price: 45,
    image_url: MASALA_DOSA_IMG,
    prep_minutes: 5,
    dietary_type: "veg",
    is_jain: true,
    is_available: true,
    available_quantity: 40,
    is_active: true,
    rating: 4.7,
    is_popular: false,
  },
  {
    id: 8,
    outlet_id: 2,
    category_id: 5,
    name: "South Indian Tiffin Combo",
    description: "1 Mini Masala Dosa + 1 Steamed Idli + 1 Medu Vada with hot filter coffee.",
    price: 110,
    image_url: MASALA_DOSA_IMG,
    prep_minutes: 12,
    dietary_type: "veg",
    is_jain: false,
    is_available: true,
    available_quantity: 20,
    is_active: true,
    rating: 4.9,
    is_popular: true,
  },
  {
    id: 9,
    outlet_id: 3,
    category_id: 6,
    name: "Special Cutting Chai",
    description: "Double cardamom, crushed ginger, boiled strong Assam CTC tea with thick boiled milk.",
    price: 15,
    image_url: MASALA_DOSA_IMG,
    prep_minutes: 3,
    dietary_type: "veg",
    is_jain: true,
    is_available: true,
    available_quantity: 120,
    is_active: true,
    rating: 4.9,
    is_popular: true,
  },
  {
    id: 10,
    outlet_id: 3,
    category_id: 6,
    name: "Chilled Cold Coffee with Ice Cream",
    description: "Thick espresso blitz with milk and ice, topped with a scoop of vanilla ice cream & cocoa dusting.",
    price: 60,
    image_url: PAV_BHAJI_IMG,
    prep_minutes: 5,
    dietary_type: "veg",
    is_jain: true,
    is_available: true,
    available_quantity: 35,
    is_active: true,
    rating: 4.8,
    is_popular: true,
  },
  {
    id: 11,
    outlet_id: 1,
    category_id: 2,
    name: "Chicken Dum Biryani",
    description: "Fragrant basmati rice layered with marinated chicken, saffron, fried onions, and served with cucumber raita.",
    price: 120,
    image_url: MASALA_DOSA_IMG,
    prep_minutes: 15,
    dietary_type: "non_veg",
    is_jain: false,
    is_available: false,
    available_quantity: 0,
    is_active: true,
    rating: 4.8,
    is_popular: true,
  },
  {
    id: 12,
    outlet_id: 1,
    category_id: 2,
    name: "Amritsari Chole Bhature",
    description: "Two huge puffed golden bhaturas served with spicy dark Punjabi chole, pickle and onion rings.",
    price: 90,
    image_url: PAV_BHAJI_IMG,
    prep_minutes: 12,
    dietary_type: "veg",
    is_jain: false,
    is_available: true,
    available_quantity: 30,
    is_active: true,
    rating: 4.8,
    is_popular: true,
  }
];

let nextFoodId = 13;
let nextOrderId = 1004;

// Pre-seeded initial orders for demo realism
const orders: OrderRecord[] = [
  {
    id: 1001,
    order_number: "B1234",
    idempotency_key: "seed-order-1",
    user_id: 5,
    outlet_id: 1,
    outlet_name: "Central Canteen",
    pickup_counter: "COUNTER 02",
    status: "PREPARING",
    payment_status: "SANDBOX_SUCCESS",
    pickup_type: "immediate",
    subtotal: 105,
    total: 105,
    created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    items: [
      { food_item_id: 1, name: "Mumbai Pav Bhaji", unit_price: 80, quantity: 1, line_total: 80 },
      { food_item_id: 2, name: "Authentic Mumbai Vada Pav", unit_price: 25, quantity: 1, line_total: 25 }
    ]
  },
  {
    id: 1002,
    order_number: "B1198",
    idempotency_key: "seed-order-2",
    user_id: 5,
    outlet_id: 2,
    outlet_name: "South Indian Corner",
    pickup_counter: "COUNTER 01",
    status: "COMPLETED",
    payment_status: "SANDBOX_SUCCESS",
    pickup_type: "immediate",
    subtotal: 70,
    total: 70,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      { food_item_id: 6, name: "Mysore Masala Dosa", unit_price: 70, quantity: 1, line_total: 70 }
    ]
  },
  {
    id: 1003,
    order_number: "B1142",
    idempotency_key: "seed-order-3",
    user_id: 5,
    outlet_id: 3,
    outlet_name: "Beverage & Snack Station",
    pickup_counter: "EXPRESS WINDOW",
    status: "COMPLETED",
    payment_status: "SANDBOX_SUCCESS",
    pickup_type: "immediate",
    subtotal: 75,
    total: 75,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { food_item_id: 10, name: "Chilled Cold Coffee with Ice Cream", unit_price: 60, quantity: 1, line_total: 60 },
      { food_item_id: 9, name: "Special Cutting Chai", unit_price: 15, quantity: 1, line_total: 15 }
    ]
  }
];

// Interactive Canteen Tables Layout
const tables: TableRecord[] = [
  { id: 1, table_number: "T-01", capacity: 4, status: "available", location: "Main Hall · Window Side" },
  { id: 2, table_number: "T-02", capacity: 4, status: "occupied", location: "Main Hall · Central" },
  { id: 3, table_number: "T-03", capacity: 2, status: "available", location: "Main Hall · Quick Nook" },
  { id: 4, table_number: "T-04", capacity: 6, status: "reserved", location: "Booth A · Faculty Corner", reserved_by: "Prof. K. Sharma", expires_at: "14:45" },
  { id: 5, table_number: "T-05", capacity: 4, status: "available", location: "Courtyard Veranda" },
  { id: 6, table_number: "T-06", capacity: 4, status: "occupied", location: "Courtyard Veranda" },
  { id: 7, table_number: "T-07", capacity: 2, status: "available", location: "High Top · Express Bar" },
  { id: 8, table_number: "T-08", capacity: 6, status: "available", location: "Booth B · Study Group" },
  { id: 9, table_number: "T-09", capacity: 4, status: "occupied", location: "South Terrace" },
  { id: 10, table_number: "T-10", capacity: 4, status: "reserved", location: "South Terrace", reserved_by: "Robotics Club", expires_at: "15:00" },
  { id: 11, table_number: "T-11", capacity: 2, status: "available", location: "Library Exit Zone" },
  { id: 12, table_number: "T-12", capacity: 6, status: "available", location: "Booth C · Lounge Area" },
];

const notifications: NotificationItem[] = [
  { id: 1, title: "Order In Kitchen", body: "Order #B1234 is currently being prepared at Central Canteen.", timestamp: "4 min ago", type: "order", read: false },
  { id: 2, title: "Campus Lunch Rush Alert", body: "Central Canteen is experiencing moderate rush. Average wait time is ~12 min.", timestamp: "25 min ago", type: "rush", read: false },
  { id: 3, title: "Express Pickup Active", body: "Counter 02 is designated for express QR pickups today.", timestamp: "1 hour ago", type: "pickup", read: true },
  { id: 4, title: "Table Reservation Reminder", body: "Reserved tables expire in 15 minutes if unverified at the counter.", timestamp: "3 hours ago", type: "announcement", read: true },
];

// Hardware ESP32/Arduino Synchronisation State
const hardwareState = {
  device_id: "ESP32-KITCHEN-DJSCE-01",
  device_model: "ESP32-WROOM-32U + Thermal POS ESC/P",
  ip_address: "192.168.1.104",
  status: "online",
  last_sync: "Just now",
  canteen_terminal: "Counter 02 / Kitchen Dispenser",
  active_printer: true,
  queued_tickets: 1,
  uptime_hours: 14.8,
};

// Auth Helpers
function getAuthUser(req: Request): UserRecord | null {
  const token = req.cookies?.byte_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (!token) return null;
  const userId = parseInt(token, 10);
  if (isNaN(userId)) return null;
  return users.find(u => u.id === userId && u.is_active) || null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ detail: "Please log in" });
    return;
  }
  (req as any).user = user;
  next();
}

function requireVendorOrAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ detail: "Please log in" });
    return;
  }
  if (!["admin", "vendor", "outlet_staff"].includes(user.role)) {
    res.status(403).json({ detail: "Vendor access required" });
    return;
  }
  (req as any).user = user;
  next();
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: "ok", service: "BYTE Campus Food OS API", version: "0.2.0" });
});

// Auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ detail: "Email and password required" });
    return;
  }
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    res.status(401).json({ detail: "Incorrect email or password" });
    return;
  }
  if (!user.is_active) {
    res.status(403).json({ detail: "Account is inactive" });
    return;
  }
  res.cookie('byte_session', user.id.toString(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 43200 * 1000,
  });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    user_type: user.user_type,
    campus_id: user.campus_id,
  });
});

app.post('/api/v1/auth/logout', (_req, res) => {
  res.clearCookie('byte_session');
  res.json({ ok: true });
});

app.get('/api/v1/auth/me', requireAuth, (req, res) => {
  const user = (req as any).user as UserRecord;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    user_type: user.user_type,
    campus_id: user.campus_id,
  });
});

// Catalog & Outlets
app.get('/api/v1/outlets', (_req, res) => {
  const activeOutlets = outlets.filter(o => o.status === 'active');
  res.json(activeOutlets);
});

app.get('/api/v1/outlets/:outletId/menu', (req, res) => {
  const outletId = parseInt(req.params.outletId, 10);
  const outlet = outlets.find(o => o.id === outletId && o.status === 'active');
  if (!outlet) {
    res.status(404).json({ detail: "Outlet not found" });
    return;
  }

  const outletCats = categories
    .filter(c => c.outlet_id === outletId && c.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const result = outletCats.map(c => {
    const items = foodItems.filter(f => f.category_id === c.id && f.is_active);
    return {
      id: c.id,
      name: c.name,
      items: items.map(i => ({
        id: i.id,
        outlet_id: i.outlet_id,
        category_id: i.category_id,
        name: i.name,
        description: i.description,
        price: i.price,
        image_url: i.image_url,
        prep_minutes: i.prep_minutes,
        dietary_type: i.dietary_type,
        is_jain: i.is_jain,
        is_available: i.is_available,
        available_quantity: i.available_quantity,
        rating: i.rating,
        is_popular: i.is_popular,
      })),
    };
  });

  res.json(result);
});

// All Food Directory (flat search/filter)
app.get('/api/v1/foods', (_req, res) => {
  const activeItems = foodItems.filter(f => f.is_active).map(i => {
    const outlet = outlets.find(o => o.id === i.outlet_id);
    return {
      ...i,
      outlet_name: outlet?.name || 'Campus Kitchen',
    };
  });
  res.json(activeItems);
});

// Canteen Live Status
app.get('/api/v1/canteen-status', (_req, res) => {
  const availableTablesCount = tables.filter(t => t.status === 'available').length;
  res.json({
    campus: "DJSCE, Mumbai",
    crowd_level: "MODERATE",
    average_wait_minutes: 12,
    available_tables: availableTablesCount,
    total_tables: tables.length,
    active_outlets_count: outlets.filter(o => o.status === 'active').length,
    rush_period: "12:30 PM – 02:00 PM",
    outlets: outlets.map(o => ({
      id: o.id,
      name: o.name,
      location: o.location,
      crowd_level: o.crowd_level,
      avg_wait_min: o.avg_wait_min,
      status: o.status,
    })),
  });
});

// Table Reservations
app.get('/api/v1/tables', (_req, res) => {
  res.json(tables);
});

app.post('/api/v1/tables/:tableId/reserve', requireAuth, (req, res) => {
  const user = (req as any).user as UserRecord;
  const tableId = parseInt(req.params.tableId, 10);
  const table = tables.find(t => t.id === tableId);
  if (!table) {
    res.status(404).json({ detail: "Table not found" });
    return;
  }
  if (table.status !== 'available') {
    res.status(409).json({ detail: "Table is not available for reservation" });
    return;
  }

  const durationMin = req.body.duration_minutes || 15;
  const expiryDate = new Date(Date.now() + durationMin * 60 * 1000);
  const timeString = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  table.status = 'reserved';
  table.reserved_by = user.name;
  table.expires_at = timeString;

  // Add notification
  notifications.unshift({
    id: notifications.length + 1,
    title: `Table ${table.table_number} Reserved`,
    body: `Your table is held until ${timeString} (${durationMin} min). Please verify at counter.`,
    timestamp: "Just now",
    type: "order",
    read: false,
  });

  res.json({ success: true, table });
});

app.post('/api/v1/tables/:tableId/cancel', requireAuth, (req, res) => {
  const tableId = parseInt(req.params.tableId, 10);
  const table = tables.find(t => t.id === tableId);
  if (!table) {
    res.status(404).json({ detail: "Table not found" });
    return;
  }
  table.status = 'available';
  table.reserved_by = undefined;
  table.expires_at = undefined;
  res.json({ success: true, table });
});

// Notifications
app.get('/api/v1/notifications', requireAuth, (_req, res) => {
  res.json(notifications);
});

app.post('/api/v1/notifications/:id/read', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const note = notifications.find(n => n.id === id);
  if (note) note.read = true;
  res.json({ success: true });
});

// Hardware Synchronisation Status
app.get('/api/v1/hardware-sync', (_req, res) => {
  res.json(hardwareState);
});

// Checkout and Order Management
app.post('/api/v1/checkout', requireAuth, (req, res) => {
  const user = (req as any).user as UserRecord;
  const { outlet_id, items, idempotency_key, pickup_type, scheduled_time, payment_method } = req.body;

  const existing = orders.find(o => o.idempotency_key === idempotency_key);
  if (existing) {
    if (existing.user_id !== user.id) {
      res.status(409).json({ detail: "Idempotency key already used" });
      return;
    }
    res.json({
      id: existing.id,
      order_number: existing.order_number,
      outlet_name: existing.outlet_name,
      pickup_counter: existing.pickup_counter,
      status: existing.status,
      total: existing.total,
      payment_status: existing.payment_status,
      message: "Existing sandbox order returned; no additional charge was created.",
    });
    return;
  }

  if (!items || !items.length) {
    res.status(400).json({ detail: "Your tray is empty" });
    return;
  }

  const ids = items.map((x: any) => x.food_item_id);
  const matched = foodItems.filter(f => ids.includes(f.id) && f.outlet_id === outlet_id && f.is_active);

  let total = 0;
  const orderItemsData = [];
  for (const line of items) {
    const item = matched.find(f => f.id === line.food_item_id);
    if (!item) continue;
    const lineTotal = item.price * line.quantity;
    total += lineTotal;
    orderItemsData.push({
      food_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: line.quantity,
      line_total: lineTotal,
    });
  }

  const outlet = outlets.find(o => o.id === outlet_id);
  const orderNum = "B" + Math.floor(1000 + Math.random() * 9000).toString();
  const pickupCounter = outlet_id === 3 ? "EXPRESS WINDOW" : `COUNTER 0${outlet_id}`;

  const order: OrderRecord = {
    id: nextOrderId++,
    order_number: orderNum,
    idempotency_key: idempotency_key || `idemp-${Date.now()}`,
    user_id: user.id,
    outlet_id,
    outlet_name: outlet?.name || "Campus Kitchen",
    pickup_counter: pickupCounter,
    status: "PLACED",
    payment_status: payment_method === 'cash' ? "CASH_AT_COUNTER" : "SANDBOX_SUCCESS",
    pickup_type: pickup_type || 'immediate',
    scheduled_time: scheduled_time || undefined,
    subtotal: total,
    total,
    created_at: new Date().toISOString(),
    items: orderItemsData,
  };

  orders.unshift(order);

  // Add a notification for user
  notifications.unshift({
    id: notifications.length + 1,
    title: `Order #${order.order_number} Confirmed`,
    body: `Placed at ${order.outlet_name}. Collect at ${order.pickup_counter}.`,
    timestamp: "Just now",
    type: "order",
    read: false,
  });

  res.json({
    id: order.id,
    order_number: order.order_number,
    outlet_name: order.outlet_name,
    pickup_counter: order.pickup_counter,
    status: order.status,
    total: order.total,
    payment_status: order.payment_status,
    message: "Sandbox campus checkout verified — no real money was collected.",
  });
});

app.get('/api/v1/orders/mine', requireAuth, (req, res) => {
  const user = (req as any).user as UserRecord;
  const myOrders = orders
    .filter(o => o.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json(myOrders.map(o => ({
    id: o.id,
    order_number: o.order_number,
    outlet_id: o.outlet_id,
    outlet_name: o.outlet_name,
    pickup_counter: o.pickup_counter,
    status: o.status,
    total: o.total,
    created_at: o.created_at,
    items: o.items.map(i => ({ name: i.name, quantity: i.quantity, unit_price: i.unit_price, line_total: i.line_total })),
  })));
});

// Vendor Endpoints
app.get('/api/v1/vendor/outlets', requireVendorOrAdmin, (req, res) => {
  const user = (req as any).user as UserRecord;
  if (user.role === 'admin') {
    res.json(outlets);
    return;
  }
  const userOutletIds = memberships.filter(m => m.user_id === user.id && m.is_active).map(m => m.outlet_id);
  const userOutlets = outlets.filter(o => userOutletIds.includes(o.id));
  res.json(userOutlets);
});

app.get('/api/v1/vendor/orders', requireVendorOrAdmin, (req, res) => {
  const user = (req as any).user as UserRecord;
  let q = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (user.role !== 'admin') {
    const userOutletIds = memberships.filter(m => m.user_id === user.id && m.is_active).map(m => m.outlet_id);
    q = q.filter(o => userOutletIds.includes(o.outlet_id));
  }

  res.json(q.slice(0, 100).map(o => ({
    id: o.id,
    order_number: o.order_number,
    outlet_id: o.outlet_id,
    outlet_name: o.outlet_name,
    pickup_counter: o.pickup_counter,
    status: o.status,
    total: o.total,
    created_at: o.created_at,
    items: o.items.map(i => ({ name: i.name, quantity: i.quantity })),
  })));
});

app.patch('/api/v1/vendor/orders/:orderId/status', requireVendorOrAdmin, (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    res.status(404).json({ detail: "Order not found" });
    return;
  }

  const nextStatus = req.body.status;
  const allowed = ["PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
  if (!allowed.includes(nextStatus)) {
    res.status(400).json({ detail: "Invalid order status" });
    return;
  }

  order.status = nextStatus;

  // If status is READY, add notification for student
  if (nextStatus === 'READY') {
    notifications.unshift({
      id: notifications.length + 1,
      title: `Order #${order.order_number} Ready for Pickup!`,
      body: `Your food is ready at ${order.pickup_counter}. Show your QR token.`,
      timestamp: "Just now",
      type: "pickup",
      read: false,
    });
  }

  res.json({ id: order.id, status: order.status });
});

app.post('/api/v1/vendor/outlets/:outletId/items', requireVendorOrAdmin, (req, res) => {
  const outletId = parseInt(req.params.outletId, 10);
  const newItem: FoodRecord = {
    id: nextFoodId++,
    outlet_id: outletId,
    category_id: parseInt(req.body.category_id, 10) || 1,
    name: req.body.name || 'Campus Special',
    description: req.body.description || 'Made fresh at the campus counter.',
    price: Number(req.body.price) || 50,
    image_url: req.body.image_url || PAV_BHAJI_IMG,
    prep_minutes: Number(req.body.prep_minutes) || 10,
    dietary_type: req.body.dietary_type || 'veg',
    is_jain: Boolean(req.body.is_jain),
    is_available: true,
    available_quantity: 30,
    is_active: true,
    rating: 4.8,
  };
  foodItems.push(newItem);
  res.json(newItem);
});

app.patch('/api/v1/vendor/items/:itemId/availability', requireVendorOrAdmin, (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const item = foodItems.find(f => f.id === itemId);
  if (!item) {
    res.status(404).json({ detail: "Item not found" });
    return;
  }
  item.is_available = Boolean(req.body.is_available);
  res.json({ id: item.id, is_available: item.is_available });
});

// Admin overview analytics
app.get('/api/v1/admin/analytics', requireAuth, (req, res) => {
  const user = (req as any).user as UserRecord;
  if (user.role !== 'admin') {
    res.status(403).json({ detail: "Admin access required" });
    return;
  }
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  res.json({
    total_orders: orders.length,
    active_users: users.length,
    total_outlets: outlets.length,
    active_menu_items: foodItems.filter(f => f.is_active).length,
    total_revenue_inr: totalRevenue,
    average_prep_time_min: 10.4,
    peak_ordering_window: "12:45 PM – 01:30 PM",
    users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, user_type: u.user_type, campus_id: u.campus_id })),
  });
});

// Server configuration
const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: HOST, port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[BYTE Campus Food OS] Running on http://${HOST}:${PORT}`);
  });
}

startServer();
