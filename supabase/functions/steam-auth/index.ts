import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';

interface SteamUser {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode');

    if (mode === 'login') {
      const returnUrl = url.searchParams.get('return_url') || 'http://localhost:5173/steam-callback';
      
      const params = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': returnUrl,
        'openid.realm': new URL(returnUrl).origin,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      });

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${STEAM_OPENID_URL}?${params.toString()}`,
        },
      });
    }

    if (mode === 'verify') {
      const claimedId = url.searchParams.get('openid.claimed_id');
      
      if (!claimedId) {
        return new Response(
          JSON.stringify({ error: 'No claimed ID found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);
      if (!steamIdMatch) {
        return new Response(
          JSON.stringify({ error: 'Invalid Steam ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const steamId = steamIdMatch[1];

      const verifyParams = new URLSearchParams();
      for (const [key, value] of url.searchParams.entries()) {
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
        return new Response(
          JSON.stringify({ error: 'Steam verification failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const apiKey = Deno.env.get('STEAM_API_KEY');
      if (!apiKey) {
        return new Response(
          JSON.stringify({ steamId, personaname: 'Unknown' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
      const steamApiResponse = await fetch(steamApiUrl);
      const steamData = await steamApiResponse.json();

      if (steamData.response?.players?.length > 0) {
        const player: SteamUser = steamData.response.players[0];
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: existingUser } = await supabase
          .from('users')
          .select('id, is_banned')
          .eq('steam_id', player.steamid)
          .maybeSingle();

        if (existingUser?.is_banned) {
          return new Response(
            JSON.stringify({ error: 'Account is banned' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!existingUser) {
          await supabase.from('users').insert({
            steam_id: player.steamid,
            steam_nickname: player.personaname,
            is_banned: false,
          });
        } else {
          await supabase
            .from('users')
            .update({ steam_nickname: player.personaname, last_login: new Date().toISOString() })
            .eq('steam_id', player.steamid);
        }

        return new Response(
          JSON.stringify({
            steamId: player.steamid,
            personaname: player.personaname,
            avatar: player.avatarfull,
            profileurl: player.profileurl,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ steamId, personaname: 'Unknown' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid mode' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Steam auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});