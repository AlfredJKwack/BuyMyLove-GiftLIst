#!/usr/bin/env node

// Script to populate Supabase database with demo data
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local file')
  process.exit(1)
}

console.log('🔗 Connecting to Supabase...')
console.log(`URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseKey)

// Demo gifts data
const demoGifts = [
  {
    title: 'Wireless Noise-Cancelling Headphones',
    hyperlink: 'https://www.amazon.com/dp/B08MVGF24M',
    note: 'Perfect for working from home and travel. Sony WH-1000XM4 with excellent battery life.',
    bought: false,
    date_added: '2024-12-01 10:00:00+00',
    bought_by_cookie: null
  },
  {
    title: 'Smart Coffee Maker',
    hyperlink: 'https://www.amazon.com/dp/B077JBQZPX',
    note: 'Programmable coffee maker that can be controlled via smartphone app. Great for morning routines!',
    bought: true,
    date_added: '2024-11-28 14:30:00+00',
    bought_by_cookie: 'user_demo123_1701234567890'
  },
  {
    title: 'Kindle Paperwhite E-reader',
    hyperlink: 'https://www.amazon.com/dp/B08KTZ8249',
    note: 'Waterproof e-reader with adjustable warm light. Perfect for reading before bed.',
    bought: false,
    date_added: '2024-11-25 09:15:00+00',
    bought_by_cookie: null
  },
  {
    title: 'Yoga Mat with Alignment Lines',
    hyperlink: 'https://www.amazon.com/dp/B01LXQZ7QX',
    note: 'High-quality non-slip yoga mat with helpful alignment guides for better poses.',
    bought: false,
    date_added: '2024-11-20 16:45:00+00',
    bought_by_cookie: null
  },
  {
    title: 'Instant Pot Pressure Cooker',
    hyperlink: 'https://www.amazon.com/dp/B00FLYWNYQ',
    note: 'Multi-functional pressure cooker that makes meal prep so much easier. 6-quart size is perfect.',
    bought: true,
    date_added: '2024-11-15 11:20:00+00',
    bought_by_cookie: 'user_demo456_1701234567891'
  },
  {
    title: 'Bluetooth Mechanical Keyboard',
    hyperlink: 'https://www.amazon.com/dp/B07QBPDQPX',
    note: 'Compact 60% mechanical keyboard with RGB lighting. Great for both work and gaming.',
    bought: false,
    date_added: '2024-11-10 13:00:00+00',
    bought_by_cookie: null
  }
]

// Demo visitor data
const demoVisitors = [
  {
    user_id: 'user_demo123_1701234567890',
    ip_address: '192.168.1.100',
    date: '2024-12-01',
    created_at: '2024-12-01 10:00:00+00'
  },
  {
    user_id: 'user_demo456_1701234567891',
    ip_address: '192.168.1.101',
    date: '2024-12-01',
    created_at: '2024-12-01 11:00:00+00'
  },
  {
    user_id: 'user_demo789_1701234567892',
    ip_address: '192.168.1.102',
    date: '2024-12-01',
    created_at: '2024-12-01 12:00:00+00'
  },
  {
    user_id: 'user_demo101_1701234567893',
    ip_address: '192.168.1.103',
    date: '2024-12-01',
    created_at: '2024-12-01 13:00:00+00'
  },
  {
    user_id: 'user_demo112_1701234567894',
    ip_address: '192.168.1.104',
    date: '2024-12-01',
    created_at: '2024-12-01 14:00:00+00'
  }
]

async function populateDatabase() {
  try {
    console.log('🧹 Clearing existing data...')
    
    // Clear existing data
    await supabase.from('daily_visitors').delete().neq('id', 0)
    await supabase.from('gifts').delete().neq('id', 0)
    
    console.log('📦 Inserting demo gifts...')
    
    // Insert gifts
    const { data: giftsData, error: giftsError } = await supabase
      .from('gifts')
      .insert(demoGifts)
      .select()
    
    if (giftsError) {
      console.error('❌ Error inserting gifts:', giftsError)
      return
    }
    
    console.log(`✅ Inserted ${giftsData.length} gifts`)
    
    console.log('👥 Inserting demo visitors...')
    
    // Insert visitors
    const { data: visitorsData, error: visitorsError } = await supabase
      .from('daily_visitors')
      .insert(demoVisitors)
      .select()
    
    if (visitorsError) {
      console.error('❌ Error inserting visitors:', visitorsError)
      return
    }
    
    console.log(`✅ Inserted ${visitorsData.length} visitors`)
    
    console.log('🎉 Demo data populated successfully!')
    console.log('\nDemo gifts added:')
    giftsData.forEach((gift, index) => {
      const status = gift.bought ? '✅ Bought' : '⭕ Available'
      console.log(`  ${index + 1}. ${gift.title} - ${status}`)
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
populateDatabase()
