import express from 'express';
import fetch from 'node-fetch';
import { query } from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';

router.get('/login', (req, res) => {
  const returnUrl = req.query.return_url || `${process.env.FRONTEND_URL}/steam-callback`;

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': new URL(returnUrl).origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  res.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
});

router.get('/verify', async (req, res) => {
  try {
    const claimedId = req.query['openid.claimed_id'];

    if (!claimedId) {
      return res.status(400).json({ error: 'No claimed ID found' });
    }

    const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);
    if (!steamIdMatch) {
      return res.status(400).json({ error: 'Invalid Steam ID' });
    }

    const steamId = steamIdMatch[1];

    const verifyParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key.startsWith('openid.')) {
        verifyParams.set(key, value);
      }
    }
    verifyParams.set('openid.mode', 'check_authentication');

    const verifyResponse = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });

    const verifyText = await verifyResponse.text();

    if (!verifyText.includes('is_valid:true')) {
      return res.status(401).json({ error: 'Steam verification failed' });
    }

    const apiKey = process.env.STEAM_API_KEY;
    let personaname = 'Unknown';
    let avatar = '';
    let profileurl = '';

    if (apiKey) {
      const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
      const steamApiResponse = await fetch(steamApiUrl);
      const steamData = await steamApiResponse.json();

      if (steamData.response?.players?.length > 0) {
        const player = steamData.response.players[0];
        personaname = player.personaname;
        avatar = player.avatarfull;
        profileurl = player.profileurl;
      }
    }

    const [existingUser] = await query(
      'SELECT * FROM users WHERE steam_id = ? LIMIT 1',
      [steamId]
    );

    if (existingUser?.is_banned) {
      return res.status(403).json({ error: 'Account is banned', reason: existingUser.ban_reason });
    }

    const isNewUser = !existingUser;

    if (!existingUser) {
      await query(
        'INSERT INTO users (id, steam_id, steam_nickname, is_banned) VALUES (UUID(), ?, ?, FALSE)',
        [steamId, personaname]
      );
    } else {
      await query(
        'UPDATE users SET steam_nickname = ?, last_login = CURRENT_TIMESTAMP WHERE steam_id = ?',
        [personaname, steamId]
      );
    }

    const [user] = await query(
      'SELECT * FROM users WHERE steam_id = ? LIMIT 1',
      [steamId]
    );

    const token = generateToken({
      id: user.id,
      steam_id: user.steam_id,
      steam_nickname: user.steam_nickname
    });

    res.json({
      token,
      is_new_user: isNewUser,
      user: {
        id: user.id,
        steam_id: user.steam_id,
        steam_nickname: user.steam_nickname,
        discord_id: user.discord_id,
        discord_username: user.discord_username,
        is_banned: user.is_banned,
        rules_passed: user.rules_passed
      },
      steamId,
      personaname,
      avatar,
      profileurl
    });
  } catch (error) {
    console.error('Steam auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
