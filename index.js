import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_REDIRECT_URI,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} = process.env;

const PORT = process.env.PORT || 8080;

app.post("/api/auth/google", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  // 1️⃣ code → access_token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code
    })
  });

  const tokenData = await tokenRes.json();

  // 2️⃣ user profile
  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    }
  );

  const profile = await profileRes.json();

  return res.json({
    id: profile.sub,
    email: profile.email,
    username: profile.name,
    avatar: profile.picture
  });
});

app.post("/api/auth/facebook", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Missing OAuth code" });
    }

    const tokenRes = await fetch(
      "https://graph.facebook.com/v19.0/oauth/access_token" +
        `?client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
        `&code=${code}`
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({
        error: "Token exchange failed",
        details: tokenData
      });
    }

    const profileRes = await fetch(
      "https://graph.facebook.com/me" +
        "?fields=id,name,picture" +
        `&access_token=${tokenData.access_token}`
    );

    const profile = await profileRes.json();

    if (!profile.id) {
      return res.status(400).json({
        error: "Failed to fetch user profile",
        details: profile
      });
    }

    return res.json({
      id: profile.id,
      username: profile.name,
      avatar: profile.picture?.data?.url
    });

  } catch (err) {
    console.error("Facebook auth error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
