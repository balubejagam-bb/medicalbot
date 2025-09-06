// This file helps Vercel to properly serve the SPA
export default function handler(req, res) {
  // Redirect to the index.html file
  res.status(200).end();
}
