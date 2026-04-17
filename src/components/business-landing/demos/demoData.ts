// Datos ficticios realistas para demos de la landing "Para Negocios"

export const demoServices = [
  { id: "1", name: "Corte señora", duration: 45, price: 25, category: "Corte" },
  { id: "2", name: "Tinte raíz", duration: 90, price: 45, category: "Color" },
  { id: "3", name: "Mechas balayage", duration: 150, price: 120, category: "Color" },
  { id: "4", name: "Peinado evento", duration: 60, price: 40, category: "Peinado" },
  { id: "5", name: "Corte caballero", duration: 30, price: 18, category: "Corte" },
  { id: "6", name: "Manicura semipermanente", duration: 45, price: 28, category: "Uñas" },
  { id: "7", name: "Tratamiento keratina", duration: 120, price: 85, category: "Tratamiento" },
];

export const demoStylists = [
  { id: "1", slug: "cristina", name: "Cristina", color: "#ec4899" },
  { id: "2", slug: "desi", name: "Desi", color: "#8b5cf6" },
  { id: "3", slug: "laura", name: "Laura", color: "#06b6d4" },
];

// Citas con la misma forma que LocalBooking (Hora HH:mm, total_duration en min, color, status, reminder_sent)
export const demoAppointments = [
  { id: "1", Hora: "09:30", total_duration: 45, customer_name: "María García", services: [{ name: "Corte señora" }], stylist: "cristina", color: "#ec4899", status: "confirmed", reminder_sent: "confirmado" },
  { id: "2", Hora: "10:00", total_duration: 150, customer_name: "Laura Martínez", services: [{ name: "Mechas balayage" }], stylist: "desi", color: "#8b5cf6", status: "confirmed", reminder_sent: null },
  { id: "3", Hora: "11:00", total_duration: 90, customer_name: "Ana López", services: [{ name: "Tinte + Corte" }], stylist: "cristina", color: "#ec4899", status: "confirmed", reminder_sent: "confirmado" },
  { id: "4", Hora: "12:30", total_duration: 60, customer_name: "Sofía Ruiz", services: [{ name: "Peinado evento" }], stylist: "laura", color: "#06b6d4", status: "confirmed", reminder_sent: null },
  { id: "5", Hora: "14:00", total_duration: 30, customer_name: "Carmen Díaz", services: [{ name: "Corte caballero" }], stylist: "desi", color: "#8b5cf6", status: "confirmed", reminder_sent: "confirmado" },
  { id: "6", Hora: "16:00", total_duration: 90, customer_name: "Elena Torres", services: [{ name: "Keratina" }], stylist: "cristina", color: "#ec4899", status: "confirmed", reminder_sent: null },
  { id: "7", Hora: "17:00", total_duration: 45, customer_name: "Paula Sánchez", services: [{ name: "Manicura" }], stylist: "laura", color: "#06b6d4", status: "confirmed", reminder_sent: "confirmado" },
];

export const demoStats = {
  todayRevenue: 485,
  weekRevenue: 2340,
  monthRevenue: 8750,
  bookingsToday: 12,
  bookingsWeek: 47,
  bookingsMonth: 186,
  avgTicket: 52,
  newClients: 8,
  returningRate: 78,
  // Dashboard extras
  nextBookingTime: "12:30",
  nextBookingName: "Sofía",
  unreadMessages: 3,
  pendingReviews: 2,
  weeklyGrowth: 18,
  // Cash register split
  cashTotal: 170,
  cardTotal: 315,
  transactionCount: 4,
  // Goals
  monthlyGoal: 12000,
  monthlyProgress: 8750,
};

export const demoTransactions = [
  { id: "1", time: "09:45", client: "María García", amount: 25, method: "card" as const, service: "Corte señora", stylist: "Cristina" },
  { id: "2", time: "12:35", client: "Laura Martínez", amount: 120, method: "card" as const, service: "Mechas balayage", stylist: "Desi" },
  { id: "3", time: "13:00", client: "Ana López", amount: 70, method: "cash" as const, service: "Tinte + Corte", stylist: "Cristina" },
  { id: "4", time: "13:35", client: "Sofía Ruiz", amount: 40, method: "card" as const, service: "Peinado evento", stylist: "Laura" },
];

export const demoWeeklyData = [
  { day: "Lun", revenue: 380, bookings: 8 },
  { day: "Mar", revenue: 520, bookings: 11 },
  { day: "Mié", revenue: 290, bookings: 6 },
  { day: "Jue", revenue: 410, bookings: 9 },
  { day: "Vie", revenue: 680, bookings: 14 },
  { day: "Sáb", revenue: 890, bookings: 18 },
  { day: "Dom", revenue: 0, bookings: 0 },
];

export const demoPopularServices = [
  { name: "Corte señora", count: 45, percentage: 28, value: 1125 },
  { name: "Tinte raíz", count: 32, percentage: 20, value: 1440 },
  { name: "Mechas", count: 28, percentage: 17, value: 3360 },
  { name: "Peinado", count: 22, percentage: 14, value: 880 },
  { name: "Otros", count: 35, percentage: 21, value: 945 },
];

export const demoTimeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
];

export const demoAvailableSlots = ["09:00", "09:30", "14:00", "14:30", "15:00", "18:00", "18:30"];

export const demoSalonInfo = {
  name: "Beauty Studio Madrid",
  tagline: "Tu espacio de belleza en el centro",
  rating: 4.8,
  reviewCount: 124,
  address: "Calle Gran Vía 45, Madrid",
  phone: "+34 612 345 678",
  heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
};

export const demoStories = [
  { id: "1", salon: "Beauty Studio", avatar: null, hasNew: true, color: "#ec4899" },
  { id: "2", salon: "Nails & Co", avatar: null, hasNew: true, color: "#8b5cf6" },
  { id: "3", salon: "Hair Art", avatar: null, hasNew: false, color: "#06b6d4" },
  { id: "4", salon: "Spa Zen", avatar: null, hasNew: false, color: "#f59e0b" },
];
