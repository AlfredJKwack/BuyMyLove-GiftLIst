import { pgTable, serial, text, timestamp, boolean, uuid, unique, doublePrecision } from 'drizzle-orm/pg-core';

// Gifts table
const gifts = pgTable('gifts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  note: text('note'),
  url: text('url'),
  imageUrl: text('image_url'),
  imageFocalX: doublePrecision('image_focal_x'),
  imageFocalY: doublePrecision('image_focal_y'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Toggles table - tracks bought status per visitor per gift
const toggles = pgTable('toggles', {
  id: serial('id').primaryKey(),
  giftId: serial('gift_id').notNull().references(() => gifts.id, { onDelete: 'cascade' }),
  visitorId: uuid('visitor_id').notNull(),
  bought: boolean('bought').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure one visitor can only have one toggle per gift
  uniqueVisitorGift: unique().on(table.giftId, table.visitorId),
}));

// Visitor logs table - track daily visitors for alerting
const visitorLogs = pgTable('visitor_logs', {
  id: serial('id').primaryKey(),
  visitorId: uuid('visitor_id').notNull(),
  visitDate: timestamp('visit_date').defaultNow().notNull(),
});

// Settings table - for storing app-level settings like read_only_mode
const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// OTP tokens table - for admin authentication
const otpTokens = pgTable('otp_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export {
  gifts,
  toggles,
  visitorLogs,
  settings,
  otpTokens,
};
