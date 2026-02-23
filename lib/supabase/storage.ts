import { getSupabaseClient } from './client'

const STORAGE_BUCKET = 'game-assets'
const TTL_DAYS = 30

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
      console.error('Upload error:', error)
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
    console.error('Upload exception:', error)
    return null
  }
}

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
      console.error('Signed URL error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Signed URL exception:', error)
    return null
  }
}

export async function deleteGameAsset(path: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete exception:', error)
    return false
  }
}

export async function listGameAssets(folder: string = '') {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder)

    if (error) {
      console.error('List error:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('List exception:', error)
    return []
  }
}
