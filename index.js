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

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing code");
  }

  // 1️⃣ code → access_token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code: String(code)
    })
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return res.status(400).json(tokenData);
  }

  // 2️⃣ profile
  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    }
  );

  const profile = await profileRes.json();

  // 3️⃣ redirect do frontendu (z danymi lub tokenem)
  res.redirect(
    `https://inkalendar-906895254064.us-west1.run.app/#/oauth-success?name=${encodeURIComponent(
      profile.name
    )}`
  );
});

app.get("/auth/facebook/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing code");
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
    return res.status(400).json(tokenData);
  }

  const profileRes = await fetch(
    "https://graph.facebook.com/me?fields=id,name,picture" +
      `&access_token=${tokenData.access_token}`
  );

  const profile = await profileRes.json();

  res.redirect(
    `https://inkalendar-906895254064.us-west1.run.app/#/oauth-success?name=${encodeURIComponent(
      profile.name
    )}`
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
