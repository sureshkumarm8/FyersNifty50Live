// API Endpoint: Fetch Paytm Market Data

const PAYTM_API_KEY = process.env.PAYTM_API_KEY || 'ebb89582a5214f3bbf93fa7f7866ce28';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return handleGet(req, res);
    } else if (req.method === 'POST') {
      return handlePost(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[PaytmMarketData] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

async function handleGet(req, res) {
  const { sessionId, action } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter required' });
  }

  // Get session from Redis or in-memory store
  try {
    // Placeholder: Implement session lookup
    return res.status(200).json({
      success: true,
      message: 'Use POST with action parameter',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

async function handlePost(req, res) {
  const { sessionId, action, securityIds } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    // Placeholder for market data operations
    if (action === 'user-details') {
      return res.status(200).json({
        success: true,
        message: 'Market data endpoint - implement per your needs',
      });
    }

    return res.status(400).json({
      error: 'Invalid action or missing parameters',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}
