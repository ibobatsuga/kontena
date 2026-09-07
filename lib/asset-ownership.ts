import { db } from './server';
export async function ownsAsset(id: string, owner: string) {
  const row = await db()
    .prepare('SELECT owner_id FROM asset_owners WHERE id=?')
    .bind(id)
    .first<{ owner_id: string }>();
  // Unmapped images were created before browser workspaces existed.
  return row ? row.owner_id === owner : owner === 'owner';
}
export async function registerAsset(id: string, owner: string) {
  await db()
    .prepare('INSERT INTO asset_owners (id,owner_id) VALUES (?,?)')
    .bind(id, owner)
    .run();
}
