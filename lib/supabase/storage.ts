import { getSupabaseClient } from './client'

const STORAGE_BUCKET = 'game-assets'
const TTL_DAYS = 30

/**
 * Upload asset to Supabase Storage
 * Following Stellar Game Studio pattern: TTL of 30 days for temporary game assets
 */
export async function uploadGameAsset(
  file: File,
  path: string
): Promise<{ url: string; path: string } | null> {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: `${TTL_DAYS * 24 * 60 * 60}`,
        upsert: false,
      })

    if (error) {
      console.error('[v0] Upload error:', error)
      return null
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('[v0] Upload exception:', error)
    return null
  }
}

/**
 * Get signed URL for private asset
 */
export async function getAssetSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('[v0] Signed URL error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('[v0] Signed URL exception:', error)
    return null
  }
}

/**
 * Delete asset from storage
 */
export async function deleteGameAsset(path: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path])

    if (error) {
      console.error('[v0] Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Delete exception:', error)
    return false
  }
}

/**
 * List assets in a folder
 */
export async function listGameAssets(folder: string = '') {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder)

    if (error) {
      console.error('[v0] List error:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('[v0] List exception:', error)
    return []
  }
}
