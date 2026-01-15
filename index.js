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
  PORT = 8080
} = process.env;

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
  console.log(`Auth server running on port ${PORT}`);
});
