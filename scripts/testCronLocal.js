// Manual test of cron-fetch logic locally
import { Redis } from '@upstash/redis';
import fs from 'fs';

// Simple .env parser
const envPath = fs.existsSync('.env') ? '.env' : '.env.local';
const envFile = fs.readFileSync(envPath, 'utf-8');
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    process.env[key.trim()] = values.join('=').trim();
  }
});

const NIFTY50_SECURITY_IDS = [
  '3351', '11536', '10940', '3787', '13538', '1922', '5900', '25',
  '694', '10604', '526', '11532', '547', '2475', '1348', '14977',
  '1594', '7229', '3045', '2885', '10999', '2031', '21808', '1232',
  '11723', '467', '11483', '15083', '1363', '5258', '157', '3506',
  '1660', '16669', '20374', '910', '3432', '236', '4963', '1394',
  '11630', '1333', '3499', '16675', '17963', '881', '4306', '317'
];

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

async function runCron() {
  const startTime = Date.now();
  console.log('🚀 Starting manual cron test...\n');

  try {
    const paytmToken = process.env.PAYTM_ACCESS_TOKEN;
    
    if (!paytmToken) {
      console.error('❌ PAYTM_ACCESS_TOKEN not found in .env');
      process.exit(1);
    }

    // 1. Fetch stocks
    console.log('📊 Fetching Nifty 50 stocks...');
    const stockPreferences = NIFTY50_SECURITY_IDS.map(id => `NSE:${id}:EQUITY`).join(',');
    const stockResponse = await fetch(
      `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(stockPreferences)}`,
      {
        headers: {
          'x-jwt-token': paytmToken,
          'Accept': 'application/json'
        }
      }
    );

    if (!stockResponse.ok) {
      throw new Error(`PayTM stocks API error: ${stockResponse.status}`);
    }

    const stockData = await stockResponse.json();
    console.log(`✅ Fetched ${stockData?.data?.length || 0} stocks`);

    // 2. Fetch Nifty Index
    console.log('📈 Fetching Nifty 50 Index...');
    const indexResponse = await fetch(
      'https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:13:INDEX',
      {
        headers: {
          'x-jwt-token': paytmToken,
          'Accept': 'application/json'
        }
      }
    );

    const indexData = await indexResponse.json();
    const niftyLTP = indexData?.data?.[0]?.last_price || indexData?.data?.[0]?.lp || null;
    console.log(`✅ Nifty LTP: ${niftyLTP}`);

    // 3. Fetch Options
    let optionsData = null;
    if (niftyLTP && niftyLTP > 0) {
      console.log('📋 Fetching options contracts...');
      try {
        const atmStrike = Math.round(niftyLTP / 50) * 50;
        const strikeRange = 20;
        const minStrike = atmStrike - (strikeRange * 50);
        const maxStrike = atmStrike + (strikeRange * 50);
        
        console.log(`   ATM: ${atmStrike}, Range: ${minStrike} - ${maxStrike}`);
        
        // Dynamic import for ES modules
        const { NIFTY_WEEKLY_OPTIONS } = await import('../constants/niftyWeeklyOptions.js');
        const filteredOptions = NIFTY_WEEKLY_OPTIONS.filter(opt => 
          opt.strike >= minStrike && opt.strike <= maxStrike
        );
        
        console.log(`   Filtered ${filteredOptions.length} options in range`);
        
        const optionIds = filteredOptions.map(opt => opt.security_id);
        
        if (optionIds.length > 0) {
          const optionPreferences = optionIds.map(id => `NSE:${id}:INDEX_OPT`).join(',');
          const optionsResponse = await fetch(
            `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(optionPreferences)}`,
            {
              headers: {
                'x-jwt-token': paytmToken,
                'Accept': 'application/json'
              }
            }
          );
          
          if (optionsResponse.ok) {
            const optData = await optionsResponse.json();
            optionsData = optData?.data || [];
            console.log(`✅ Fetched ${optionsData.length} options contracts`);
          } else {
            console.warn(`⚠️  Options API returned ${optionsResponse.status}`);
          }
        }
      } catch (optError) {
        console.error('❌ Options fetch error:', optError.message);
      }
    }

    const duration = Date.now() - startTime;

    // 4. Save to Redis
    console.log('\n💾 Saving to Redis...');
    const snapshot = {
      timestamp: Date.now(),
      istTime: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      niftyLTP,
      stocks: stockData?.data || [],
      options: optionsData || [],
      stockCount: stockData?.data?.length || 0,
      optionsCount: optionsData?.length || 0,
      duration
    };

    await redis.set('snapshot:latest', JSON.stringify(snapshot));
    console.log('✅ Saved to Redis: snapshot:latest');

    console.log('\n📊 Summary:');
    console.log(`   Stocks: ${snapshot.stockCount}`);
    console.log(`   Options: ${snapshot.optionsCount}`);
    console.log(`   Nifty LTP: ${niftyLTP}`);
    console.log(`   Duration: ${duration}ms`);
    console.log('\n🎉 Done! Refresh your app to see options data.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runCron();
