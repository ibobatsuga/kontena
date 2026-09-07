import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  payload: text('payload').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const schedules = sqliteTable(
  'schedules',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    scheduledAt: text('scheduled_at').notNull(),
    platform: text('platform').notNull(),
    status: text('status').notNull(),
    autoPost: integer('auto_post').notNull().default(0),
    mode: text('mode').notNull(),
    error: text('error'),
    publishedId: text('published_id'),
    payload: text('payload').notNull(),
  },
  (t) => [index('idx_schedules_due').on(t.status, t.scheduledAt)],
);
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull(),
});
