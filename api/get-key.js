export default function handler(req, res) {
  // This is backend code, so it reads a variable WITHOUT the 'VITE_' prefix.
  const apiKey = process.env.DECART_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // This sends a clear JSON error if the key is missing on the server.
    return res.status(500).json({ error: 'API key is not configured on the Vercel server environment.' });
  }

  // This sends the key back to the frontend in the expected JSON format.
  res.status(200).json({ apiKey: apiKey });
}
