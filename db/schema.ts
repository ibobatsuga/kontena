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
    ownerId: text('owner_id'),
    accountId: text('account_id'),
    accountName: text('account_name'),
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
export const socialAccounts = sqliteTable(
  'social_accounts',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    platform: text('platform').notNull(),
    remoteId: text('remote_id').notNull(),
    name: text('name').notNull(),
    username: text('username'),
    token: text('token').notNull(),
    expiresAt: text('expires_at'),
    status: text('status').notNull(),
    permissions: text('permissions').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('idx_social_owner').on(t.ownerId, t.status)],
);
export const oauthStates = sqliteTable('oauth_states', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  browserHash: text('browser_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
});
export const socialConfig = sqliteTable('social_config', {
  ownerId: text('owner_id').primaryKey(),
  appId: text('app_id').notNull(),
  secret: text('secret').notNull(),
});
