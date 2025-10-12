import { supabase } from './supabaseClient.js';

export interface ImageUploadResult {
  url: string;
  path: string;
}

export class StorageService {
  private bucketName = 'imagens';

  /**
   * Upload an image file to Supabase storage
   * @param file - The file to upload
   * @param entidadeId - The ID of the entidade (used for organizing files)
   * @returns The public URL and storage path of the uploaded image
   */
  async uploadImage(file: File, entidadeId: number): Promise<ImageUploadResult> {
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `entidade_${entidadeId}_${timestamp}.${fileExt}`;
      const filePath = `entidades/${entidadeId}/${fileName}`;

      // Upload the file
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        url: publicUrlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  }

  /**
   * Delete an image from storage
   * @param path - The storage path of the image
   */
  async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('Error deleting file:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteImage:', error);
      throw error;
    }
  }

  /**
   * List all images for a specific entidade
   * @param entidadeId - The ID of the entidade
   * @returns Array of file objects
   */
  async listEntidadeImages(entidadeId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(`entidades/${entidadeId}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error('Error listing files:', error);
        throw new Error(`Failed to list images: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in listEntidadeImages:', error);
      throw error;
    }
  }

  /**
   * Get the public URL for an image path
   * @param path - The storage path of the image
   * @returns The public URL
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Extract the storage path from a public URL
   * @param url - The public URL
   * @returns The storage path
   */
  extractPathFromUrl(url: string): string | null {
    try {
      // URL format: https://{project}.supabase.co/storage/v1/object/public/imagens/{path}
      const match = url.match(/\/imagens\/(.+)$/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting path from URL:', error);
      return null;
    }
  }
}

export const storageService = new StorageService();
