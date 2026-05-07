// Direct test of Redis data
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

async function test() {
  try {
    console.log('📡 Fetching latest snapshot from Redis...');
    const data = await redis.get('snapshot:latest');
    
    if (!data) {
      console.log('❌ No data found in Redis');
      return;
    }
    
    const snapshot = typeof data === 'string' ? JSON.parse(data) : data;
    
    console.log('\n✅ Snapshot found:');
    console.log('  📊 Stocks:', snapshot.stockCount || snapshot.stocks?.length || 0);
    console.log('  📈 Options:', snapshot.optionsCount || snapshot.options?.length || 0);
    console.log('  💰 Nifty LTP:', snapshot.niftyLTP);
    console.log('  🕒 Timestamp:', new Date(snapshot.timestamp).toLocaleString());
    
    if (snapshot.options && snapshot.options.length > 0) {
      console.log('\n📋 First 3 options:');
      snapshot.options.slice(0, 3).forEach(opt => {
        console.log('  -', opt.security_id || opt.sec, '|', opt.last_price || opt.lp);
      });
    } else {
      console.log('\n⚠️  Options array is empty or missing');
      console.log('   Keys in snapshot:', Object.keys(snapshot));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
