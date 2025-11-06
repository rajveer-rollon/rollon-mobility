import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  users, type User, type InsertUser, type UpsertUser,
  dealers, type Dealer, type InsertDealer,
  tyres, type Tyre, type InsertTyre,
  bookings, type Booking, type InsertBooking,
  payments, type Payment, type InsertPayment,
  feedback, type Feedback, type InsertFeedback,
  evStations, type EVStation, type InsertEVStation
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserApproval(id: string, isApproved: boolean): Promise<void>;
  updateUserRole(id: string, role: string): Promise<void>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Dealers
  createDealer(dealer: InsertDealer): Promise<Dealer>;
  getDealerByUserId(userId: string): Promise<Dealer | undefined>;
  updateDealerSubscription(id: string, subscriptionType: string, expiresAt: Date): Promise<void>;
  getAllDealers(): Promise<Dealer[]>;
  
  // Tyres
  createTyre(tyre: InsertTyre): Promise<Tyre>;
  getTyresByDealerId(dealerId: string): Promise<Tyre[]>;
  getAllTyres(): Promise<Tyre[]>;
  getTyresByBrand(brand: string): Promise<Tyre[]>;
  updateTyreStock(id: string, stock: number): Promise<void>;
  
  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingsByCustomerId(customerId: string): Promise<Booking[]>;
  getBookingsByDriverId(driverId: string): Promise<Booking[]>;
  getPendingBookings(): Promise<Booking[]>;
  updateBookingStatus(id: string, status: string, driverId?: string): Promise<void>;
  completeBooking(id: string, fare: string): Promise<void>;
  getAllBookings(): Promise<Booking[]>;
  
  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUserId(userId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: string, razorpayPaymentId?: string): Promise<void>;
  
  // Feedback
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedbackByBookingId(bookingId: string): Promise<Feedback | undefined>;
  
  // EV Stations
  createEVStation(station: InsertEVStation): Promise<EVStation>;
  getEVStationByUserId(userId: string): Promise<EVStation | undefined>;
  getAllEVStations(): Promise<EVStation[]>;
  updateEVStationAvailability(id: string, availability: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserApproval(id: string, isApproved: boolean): Promise<void> {
    await db.update(users).set({ isApproved }).where(eq(users.id, id));
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, id));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Dealers
  async createDealer(dealer: InsertDealer): Promise<Dealer> {
    const result = await db.insert(dealers).values(dealer).returning();
    return result[0];
  }

  async getDealerByUserId(userId: string): Promise<Dealer | undefined> {
    const result = await db.select().from(dealers).where(eq(dealers.userId, userId));
    return result[0];
  }

  async updateDealerSubscription(id: string, subscriptionType: string, expiresAt: Date): Promise<void> {
    await db.update(dealers).set({ subscriptionType, subscriptionExpiresAt: expiresAt }).where(eq(dealers.id, id));
  }

  async getAllDealers(): Promise<Dealer[]> {
    return await db.select().from(dealers);
  }

  // Tyres
  async createTyre(tyre: InsertTyre): Promise<Tyre> {
    const result = await db.insert(tyres).values(tyre).returning();
    return result[0];
  }

  async getTyresByDealerId(dealerId: string): Promise<Tyre[]> {
    return await db.select().from(tyres).where(eq(tyres.dealerId, dealerId));
  }

  async getAllTyres(): Promise<Tyre[]> {
    return await db.select().from(tyres);
  }

  async getTyresByBrand(brand: string): Promise<Tyre[]> {
    return await db.select().from(tyres).where(eq(tyres.brand, brand));
  }

  async updateTyreStock(id: string, stock: number): Promise<void> {
    await db.update(tyres).set({ stock }).where(eq(tyres.id, id));
  }

  // Bookings
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async getBookingsByCustomerId(customerId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.customerId, customerId));
  }

  async getBookingsByDriverId(driverId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.driverId, driverId));
  }

  async getPendingBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.status, "pending"));
  }

  async updateBookingStatus(id: string, status: string, driverId?: string): Promise<void> {
    const updates: any = { status };
    if (driverId) updates.driverId = driverId;
    await db.update(bookings).set(updates).where(eq(bookings.id, id));
  }

  async completeBooking(id: string, fare: string): Promise<void> {
    await db.update(bookings).set({ 
      status: "completed", 
      fare,
      completedAt: new Date()
    }).where(eq(bookings.id, id));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async updatePaymentStatus(id: string, status: string, razorpayPaymentId?: string): Promise<void> {
    const updates: any = { status };
    if (razorpayPaymentId) updates.razorpayPaymentId = razorpayPaymentId;
    await db.update(payments).set(updates).where(eq(payments.id, id));
  }

  // Feedback
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const result = await db.insert(feedback).values(feedbackData).returning();
    return result[0];
  }

  async getFeedbackByBookingId(bookingId: string): Promise<Feedback | undefined> {
    const result = await db.select().from(feedback).where(eq(feedback.bookingId, bookingId));
    return result[0];
  }

  // EV Stations
  async createEVStation(station: InsertEVStation): Promise<EVStation> {
    const result = await db.insert(evStations).values(station).returning();
    return result[0];
  }

  async getEVStationByUserId(userId: string): Promise<EVStation | undefined> {
    const result = await db.select().from(evStations).where(eq(evStations.userId, userId));
    return result[0];
  }

  async getAllEVStations(): Promise<EVStation[]> {
    return await db.select().from(evStations);
  }

  async updateEVStationAvailability(id: string, availability: string): Promise<void> {
    await db.update(evStations).set({ availability }).where(eq(evStations.id, id));
  }
}

export const storage = new DbStorage();
