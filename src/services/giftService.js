import { supabase } from '../supabase.js'
import { getUserId, getClientIP } from '../utils/cookies.js'

export class GiftService {
  constructor() {
    this.tableName = 'gifts'
    this.visitorsTableName = 'daily_visitors'
  }

  // Get all gifts
  async getGifts() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('date_added', { ascending: false })

    if (error) {
      console.error('Error fetching gifts:', error)
      throw error
    }

    return data || []
  }

  // Add a new gift (admin only)
  async addGift(giftData) {
    const gift = {
      title: giftData.title,
      hyperlink: giftData.hyperlink,
      note: giftData.note || null,
      image_url: giftData.image_url || null,
      bought: false,
      date_added: new Date().toISOString(),
      bought_by_cookie: null
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .insert([gift])
      .select()

    if (error) {
      console.error('Error adding gift:', error)
      throw error
    }

    return data[0]
  }

  // Update a gift (admin only)
  async updateGift(id, giftData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(giftData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating gift:', error)
      throw error
    }

    return data[0]
  }

  // Delete a gift (admin only)
  async deleteGift(id) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting gift:', error)
      throw error
    }

    return true
  }

  // Toggle bought status (anonymous users with restrictions)
  async toggleBoughtStatus(id, currentBought, currentBoughtByCookie) {
    const userId = getUserId()
    
    // Check if user can toggle this gift
    if (currentBought && currentBoughtByCookie !== userId) {
      throw new Error('You can only unmark gifts that you marked as bought')
    }

    // Check daily visitor limit before allowing toggle
    await this.recordVisitor()

    const newBought = !currentBought
    const newBoughtByCookie = newBought ? userId : null

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        bought: newBought,
        bought_by_cookie: newBoughtByCookie
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error toggling bought status:', error)
      throw error
    }

    return data[0]
  }

  // Record visitor for throttling
  async recordVisitor() {
    const userId = getUserId()
    const clientIP = await getClientIP()
    const today = new Date().toISOString().split('T')[0]

    // Check if this user/IP combo already visited today
    const { data: existingVisitor } = await supabase
      .from(this.visitorsTableName)
      .select('*')
      .eq('date', today)
      .eq('user_id', userId)
      .eq('ip_address', clientIP)
      .single()

    if (!existingVisitor) {
      // Record new visitor
      const { error } = await supabase
        .from(this.visitorsTableName)
        .insert([{
          user_id: userId,
          ip_address: clientIP,
          date: today,
          created_at: new Date().toISOString()
        }])

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error recording visitor:', error)
      }

      // Check if we've exceeded the daily limit
      await this.checkDailyVisitorLimit(today)
    }
  }

  // Check daily visitor limit and alert if exceeded
  async checkDailyVisitorLimit(date) {
    const { data, error } = await supabase
      .from(this.visitorsTableName)
      .select('user_id, ip_address')
      .eq('date', date)

    if (error) {
      console.error('Error checking visitor limit:', error)
      return
    }

    // Count unique visitors (by user_id + ip combination)
    const uniqueVisitors = new Set(
      data.map(visitor => `${visitor.user_id}_${visitor.ip_address}`)
    ).size

    if (uniqueVisitors > 12) {
      console.warn(`Daily visitor limit exceeded: ${uniqueVisitors} unique visitors on ${date}`)
      
      // In a real app, this would send an email or notification to admin
      // For now, we'll log it and could store it in a separate alerts table
      await this.logAlert(`Daily visitor limit exceeded: ${uniqueVisitors} unique visitors on ${date}`)
    }
  }

  // Log alert (could be extended to send emails, etc.)
  async logAlert(message) {
    try {
      const { error } = await supabase
        .from('alerts')
        .insert([{
          message,
          created_at: new Date().toISOString(),
          type: 'visitor_limit_exceeded'
        }])

      if (error) {
        console.error('Error logging alert:', error)
      }
    } catch (err) {
      console.error('Alert logging failed:', err)
    }
  }

  // Upload image to Supabase storage
  async uploadImage(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `gift-images/${fileName}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (error) {
      console.error('Error uploading image:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  // Delete image from storage
  async deleteImage(imageUrl) {
    if (!imageUrl) return

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/')
      const filePath = urlParts.slice(-2).join('/')

      const { error } = await supabase.storage
        .from('images')
        .remove([filePath])

      if (error) {
        console.error('Error deleting image:', error)
      }
    } catch (err) {
      console.error('Image deletion failed:', err)
    }
  }
}

export const giftService = new GiftService()
