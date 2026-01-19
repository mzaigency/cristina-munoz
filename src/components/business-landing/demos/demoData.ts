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
  { id: "1", name: "Cristina", avatar: null, color: "#ec4899" },
  { id: "2", name: "Desi", avatar: null, color: "#8b5cf6" },
  { id: "3", name: "Laura", avatar: null, color: "#06b6d4" },
];

export const demoAppointments = [
  { id: "1", time: "09:30", endTime: "10:15", client: "María García", service: "Corte señora", stylistId: "1", stylistName: "Cristina", color: "#ec4899" },
  { id: "2", time: "10:00", endTime: "12:30", client: "Laura Martínez", service: "Mechas balayage", stylistId: "2", stylistName: "Desi", color: "#8b5cf6" },
  { id: "3", time: "11:00", endTime: "12:30", client: "Ana López", service: "Tinte + Corte", stylistId: "1", stylistName: "Cristina", color: "#ec4899" },
  { id: "4", time: "12:30", endTime: "13:30", client: "Sofía Ruiz", service: "Peinado evento", stylistId: "3", stylistName: "Laura", color: "#06b6d4" },
  { id: "5", time: "14:00", endTime: "14:30", client: "Carmen Díaz", service: "Corte caballero", stylistId: "2", stylistName: "Desi", color: "#8b5cf6" },
  { id: "6", time: "16:00", endTime: "17:30", client: "Elena Torres", service: "Tratamiento keratina", stylistId: "1", stylistName: "Cristina", color: "#ec4899" },
  { id: "7", time: "17:00", endTime: "17:45", client: "Paula Sánchez", service: "Manicura", stylistId: "3", stylistName: "Laura", color: "#06b6d4" },
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
};

export const demoTransactions = [
  { id: "1", time: "09:45", client: "María García", amount: 25, method: "card", service: "Corte señora" },
  { id: "2", time: "12:35", client: "Laura Martínez", amount: 120, method: "card", service: "Mechas balayage" },
  { id: "3", time: "13:00", client: "Ana López", amount: 70, method: "cash", service: "Tinte + Corte" },
  { id: "4", time: "13:35", client: "Sofía Ruiz", amount: 40, method: "card", service: "Peinado evento" },
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
  { name: "Corte señora", count: 45, percentage: 28 },
  { name: "Tinte raíz", count: 32, percentage: 20 },
  { name: "Mechas", count: 28, percentage: 17 },
  { name: "Peinado", count: 22, percentage: 14 },
  { name: "Otros", count: 35, percentage: 21 },
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
};

export const demoStories = [
  { id: "1", salon: "Beauty Studio", avatar: null, hasNew: true, color: "#ec4899" },
  { id: "2", salon: "Nails & Co", avatar: null, hasNew: true, color: "#8b5cf6" },
  { id: "3", salon: "Hair Art", avatar: null, hasNew: false, color: "#06b6d4" },
  { id: "4", salon: "Spa Zen", avatar: null, hasNew: false, color: "#f59e0b" },
];
