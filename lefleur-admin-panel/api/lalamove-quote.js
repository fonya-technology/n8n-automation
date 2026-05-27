const crypto = require('crypto');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = 'pk_test_0f74e0a3aef202acc5012e42c7fcbe9c';
  const API_SECRET = 'sk_test_6ssmA+2jGNG4ax9r1eC16X9PyeTq8UY7+0SUF5tsC59fMCv9N2ZxhhwIv1rqV6t+';
  const BASE_URL = 'https://sandbox-rest.lalamove.com';

  const { lat, lng, delivery_address, customer_id } = req.body;

  const timestamp = Date.now().toString();
  const method = 'POST';
  const path = '/v3/quotations';

  const body = {
    serviceType: "MOTORCYCLE",
    language: "en_PH",
    stops: [
      {
        coordinates: {
          lat: "14.605867799999999",
          lng: "121.0374405"
        },
        address: "333 Col. Bonny Serrano Ave, San Juan City"
      },
      {
        coordinates: {
          lat: lat.toString(),
          lng: lng.toString()
        },
        address: delivery_address
      }
    ],
    requesterContact: {
      name: "Le Fleur",
      phone: "+639625593930"
    }
  };

  const rawBody = JSON.stringify(body);
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${rawBody}`;
  const signature = crypto.createHmac('sha256', API_SECRET).update(rawSignature).digest('hex');

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `hmac ${API_KEY}:${timestamp}:${signature}`,
        'Market': 'PH',
        'Request-ID': `${customer_id}-${timestamp}`
      },
      body: rawBody
    });

    const responseText = await response.text();
    console.log('Lalamove status:', response.status);
    console.log('Lalamove response:', responseText);

    if (!response.ok) {
      return res.status(500).json({ 
        error: 'Lalamove API error',
        status: response.status,
        details: responseText
      });
    }

    const data = JSON.parse(responseText);
    return res.status(200).json(data);

  } catch (error) {
    console.log('Fetch error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
