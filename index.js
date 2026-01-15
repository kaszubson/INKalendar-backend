import express from "express";

import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
} = process.env;


/**
 * GOOGLE
 */
app.post("/api/auth/google", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    // 1️⃣ exchange code → access_token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: "https://inkalendar-906895254064.us-west1.run.app",
        grant_type: "authorization_code",
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json(tokenData);
    }

    // 2️⃣ fetch profile
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const profile = await profileRes.json();

    return res.json({
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      avatar: profile.picture,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Google auth failed" });
  }
});

/**
 * FACEBOOK / INSTAGRAM
 */
app.post("/api/auth/facebook", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    const tokenRes = await fetch(
      "https://graph.facebook.com/v19.0/oauth/access_token" +
        `?client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&redirect_uri=https://inkalendar-906895254064.us-west1.run.app` +
        `&code=${code}`
    );

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json(tokenData);
    }

    const profileRes = await fetch(
      "https://graph.facebook.com/me?fields=id,name,picture,email" +
        `&access_token=${tokenData.access_token}`
    );

    const profile = await profileRes.json();

    return res.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar: profile.picture?.data?.url,
    });
  } catch (err) {
    console.error("Facebook auth error:", err);
    res.status(500).json({ error: "Facebook auth failed" });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});