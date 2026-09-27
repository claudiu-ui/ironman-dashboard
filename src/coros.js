// ============================================
// COROS MCP Integration
// OAuth2 PKCE + MCP Protocol for Health Data
// ============================================

const COROS_CLIENT_ID = 'e4480b0e-f3b5-42ed-b175-7fe06b5ba203';
const COROS_MCP_URL = 'https://mcp.coros.com/mcp';
const COROS_DISCOVERY_URL = 'https://mcp.coros.com/.well-known/oauth-authorization-server';
const COROS_REDIRECT_URI = 'https://claudiu-ui.github.io/ironman-dashboard/';
const COROS_STORAGE_KEY = 'coros_mcp_tokens';
const COROS_WELLNESS_CACHE_KEY = 'coros_wellness_cache';
const COROS_WELLNESS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

let cachedOAuthConfig = null;
async function getOAuthConfig() {
  if (cachedOAuthConfig) return cachedOAuthConfig;
  try {
    const res = await fetch(COROS_DISCOVERY_URL);
    const data = await res.json();
    cachedOAuthConfig = {
      authUrl: data.authorization_endpoint,
      tokenUrl: data.token_endpoint,
      registerUrl: data.registration_endpoint
    };
    return cachedOAuthConfig;
  } catch (e) {
    console.error('Failed to discover Coros OAuth endpoints', e);
    return {
      authUrl: 'https://mcpeu.coros.com/oauth2/authorize',
      tokenUrl: 'https://mcpeu.coros.com/oauth2/token',
      registerUrl: 'https://mcpeu.coros.com/connect/register'
    };
  }
}

async function getOrRegisterClientId(config) {
  let clientId = localStorage.getItem('coros_dynamic_client_id_v2');
  if (clientId) return clientId;

  try {
    const resp = await fetch(config.registerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Ironman Dashboard',
        redirect_uris: [COROS_REDIRECT_URI],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        scope: 'openid mcp.tools offline_access',
        token_endpoint_auth_method: 'none'
      })
    });
    if (!resp.ok) throw new Error('Registration failed');
    const data = await resp.json();
    clientId = data.client_id;
    localStorage.setItem('coros_dynamic_client_id_v2', clientId);
    return clientId;
  } catch (e) {
    console.error('Failed to register dynamic client', e);
    // Fallback to the hardcoded US one if registration fails, though it might 400
    return COROS_CLIENT_ID;
  }
}

// ── PKCE Helpers ──────────────────────────────────────────────────────────────

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
}

function base64urlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generatePKCE() {
  const verifier = generateRandomString(64);
  const challenge = base64urlEncode(await sha256(verifier));
  return { verifier, challenge };
}

// ── Token Management ──────────────────────────────────────────────────────────

function getStoredTokens() {
  try {
    const raw = localStorage.getItem(COROS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function storeTokens(tokens) {
  tokens.stored_at = Date.now();
  localStorage.setItem(COROS_STORAGE_KEY, JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem(COROS_STORAGE_KEY);
}

function isTokenExpired(tokens) {
  if (!tokens || !tokens.access_token) return true;
  const expiresIn = (tokens.expires_in || 3600) * 1000;
  return Date.now() - (tokens.stored_at || 0) > expiresIn - 60000; // 1 min buffer
}

async function refreshAccessToken(tokens) {
  if (!tokens.refresh_token) return null;

  const config = await getOAuthConfig();
  const clientId = await getOrRegisterClientId(config);

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: tokens.refresh_token,
  });
  
  try {
    const resp = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!resp.ok) {
      clearTokens();
      return null;
    }
    const newTokens = await resp.json();
    newTokens.refresh_token = newTokens.refresh_token || tokens.refresh_token;
    storeTokens(newTokens);
    return newTokens;
  } catch {
    return null;
  }
}

async function getValidToken() {
  let tokens = getStoredTokens();
  if (!tokens) return null;

  if (isTokenExpired(tokens)) {
    tokens = await refreshAccessToken(tokens);
  }

  return tokens?.access_token || null;
}

// ── OAuth Flow ────────────────────────────────────────────────────────────────

export async function startCorosAuth() {
  const { verifier, challenge } = await generatePKCE();
  const state = generateRandomString(32);

  // Store PKCE verifier and state for callback
  sessionStorage.setItem('coros_pkce_verifier', verifier);
  sessionStorage.setItem('coros_oauth_state', state);

  const config = await getOAuthConfig();
  const clientId = await getOrRegisterClientId(config);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: COROS_REDIRECT_URI,
    scope: 'openid mcp.tools offline_access',
    state: state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${config.authUrl}?${params.toString()}`;
}

export async function handleCorosCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) return false;

  const savedState = sessionStorage.getItem('coros_oauth_state');
  const verifier = sessionStorage.getItem('coros_pkce_verifier');

  if (!savedState || state !== savedState || !verifier) {
    console.error('COROS OAuth: state mismatch or missing verifier');
    alert('Eroare logare COROS: Eroare de securitate (State mismatch). Te rog încearcă din nou.');
    // Clean up URL params
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, '', url.pathname + url.hash);
    return false;
  }

  // Exchange code for tokens
  const config = await getOAuthConfig();
  const clientId = await getOrRegisterClientId(config);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code: code,
    redirect_uri: COROS_REDIRECT_URI,
    code_verifier: verifier,
  });

  try {
    const resp = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('COROS token exchange failed:', err);
      alert('Eroare logare COROS (Server): ' + err);
      return false;
    }

    const tokens = await resp.json();
    storeTokens(tokens);

    // Cleanup
    sessionStorage.removeItem('coros_pkce_verifier');
    sessionStorage.removeItem('coros_oauth_state');
    
    return true;
  } catch (e) {
    console.error('COROS token exchange error:', e);
    alert('Eroare logare COROS: ' + (e.message || String(e)));
    return false;
  } finally {
    // ALWAYS clean URL
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, '', url.pathname + url.hash);
  }
}

// ── MCP Tool Calls ────────────────────────────────────────────────────────────

let mcpSessionId = null;

async function callMcpTool(toolName, args = {}) {
  const token = await getValidToken();
  if (!token) return null;

  const config = await getOAuthConfig();
  // e.g. https://mcpeu.coros.com/oauth2/token -> https://mcpeu.coros.com/mcp
  const mcpUrl = config.tokenUrl.replace('/oauth2/token', '/mcp');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json, text/event-stream',
  };

  // If we have a session ID from a previous call, include it
  if (mcpSessionId) {
    headers['Mcp-Session-Id'] = mcpSessionId;
  }

  // First, try to initialize if we don't have a session
  if (!mcpSessionId) {
    try {
      const initResp = await fetch(mcpUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'IronmanDashboard', version: '1.0.0' }
          }
        }),
      });

      if (initResp.ok) {
        const sessionHeader = initResp.headers.get('Mcp-Session-Id');
        if (sessionHeader) {
          mcpSessionId = sessionHeader;
          headers['Mcp-Session-Id'] = mcpSessionId;
        }

        // Send initialized notification
        await fetch(mcpUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/initialized',
          }),
        });
      }
    } catch (e) {
      console.warn('MCP init failed:', e);
    }
  }

  // Now call the tool
  const resp = await fetch(mcpUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`MCP tool ${toolName} failed:`, resp.status, errText);
    throw new Error(`MCP tool ${toolName} failed (${resp.status}): ${errText}`);
  }

  // Update session ID from response
  const newSessionId = resp.headers.get('Mcp-Session-Id');
  if (newSessionId) mcpSessionId = newSessionId;

  const contentType = resp.headers.get('Content-Type') || '';

  // Handle SSE response
  if (contentType.includes('text/event-stream')) {
    const text = await resp.text();
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.error) {
            let errMsg = JSON.stringify(data.error);
            if (errMsg.includes('Unknown tool') || errMsg.includes('invalid_tool_name')) {
              try {
                const listResp = await fetch(mcpUrl, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/list' }) });
                const listData = await listResp.json();
                if (listData.result && listData.result.tools) errMsg += ` | Available: ` + listData.result.tools.map(t => t.name).join(', ');
              } catch (e) {}
            }
            throw new Error(`MCP tool ${toolName} JSON-RPC error: ${errMsg}`);
          }
          if (data.result) return data.result;
        } catch (e) {
          if (e.message.includes('JSON-RPC error')) throw e;
        }
      }
    }
    return null;
  }

  // Handle direct JSON response
  const data = await resp.json();
  if (data.error) {
    let errMsg = JSON.stringify(data.error);
    if (errMsg.includes('Unknown tool') || errMsg.includes('invalid_tool_name')) {
      try {
        const listResp = await fetch(mcpUrl, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/list' }) });
        const listData = await listResp.json();
        if (listData.result && listData.result.tools) errMsg += ` | Available: ` + listData.result.tools.map(t => t.name).join(', ');
      } catch (e) {}
    }
    throw new Error(`MCP tool ${toolName} JSON-RPC error: ${errMsg}`);
  }
  return data.result || data;
}

// ── High-level Data Fetchers ──────────────────────────────────────────────────

export async function fetchCorosWellness() {

  const token = await getValidToken();
  if (!token) return null;

  const today = new Date().toISOString().split('T')[0];

  // Fetch sleep data and HRV in parallel
  const [sleepResult, hrvResult, rhrResult, healthResult] = await Promise.all([
    callMcpTool('querySleepData', { date: today }),
    callMcpTool('querySleepHrv', { date: today }),
    callMcpTool('queryRestingHeartRate', { startDate: today, endDate: today }),
    callMcpTool('queryDailyHealthData', { date: today })
  ]);

  // Parse sleep data from MCP response
  let sleepData = null;
  if (sleepResult?.content) {
    for (const item of sleepResult.content) {
      if (item.type === 'text') {
        try { sleepData = JSON.parse(item.text); } catch { sleepData = item.text; }
      }
    }
  }

  let hrvData = null;
  if (hrvResult?.content) {
    for (const item of hrvResult.content) {
      if (item.type === 'text') {
        try { hrvData = JSON.parse(item.text); } catch { hrvData = item.text; }
      }
    }
  }

  let rhrData = null;
  if (rhrResult?.content) {
    for (const item of rhrResult.content) {
      if (item.type === 'text') {
        try { rhrData = JSON.parse(item.text); } catch { rhrData = item.text; }
      }
    }
  }

  let healthData = null;
  if (healthResult?.content) {
    for (const item of healthResult.content) {
      if (item.type === 'text') {
        try { healthData = JSON.parse(item.text); } catch { healthData = item.text; }
      }
    }
  }

  const wellness = {
    source: 'coros',
    fetchedAt: Date.now(),
    // Sleep
    sleepScore: extractNum(sleepData, 'score', 'sleepScore', 'sleep_score'),
    sleepSecs: extractSleepDuration(sleepData),
    deepSleepPct: extractNum(sleepData, 'deepRatio', 'deep_ratio', 'deepSleepRatio'),
    remSleepPct: extractNum(sleepData, 'remRatio', 'rem_ratio', 'remSleepRatio'),
    lightSleepPct: extractNum(sleepData, 'lightRatio', 'light_ratio', 'lightSleepRatio'),
    // HRV
    hrv: extractNum(hrvData, 'avg', 'average', 'hrvAvg', 'hrv', 'dailyAvg'),
    // RHR
    restingHR: extractNum(rhrData, 'restingHr', 'resting_hr', 'restingHeartRate', 'avg', 'value'),
    // Daily Health
    steps: extractNum(healthData, 'steps', 'step'),
    calories: extractNum(healthData, 'calories', 'activeCalories', 'calorie'),
    stress: extractNum(healthData, 'stress', 'avgStress', 'dailyStress'),
    // Raw data for debugging
    _raw: { sleepData, hrvData, rhrData, healthData },
  };

  localStorage.setItem(COROS_WELLNESS_CACHE_KEY, JSON.stringify(wellness));
  return wellness;
}

// Helper to extract a numeric value from a potentially nested/unknown structure
function extractNum(data, ...keys) {
  if (!data) return null;
  if (typeof data === 'number') return data;
  if (typeof data === 'string') {
    // Try parsing JSON string
    try { data = JSON.parse(data); } catch { return null; }
  }
  // Direct key lookup
  for (const key of keys) {
    if (data[key] != null) return Number(data[key]);
  }
  // Search nested 'data' field
  if (data.data) {
    for (const key of keys) {
      if (data.data[key] != null) return Number(data.data[key]);
    }
    // If data.data is an array, try the first item
    if (Array.isArray(data.data) && data.data.length > 0) {
      const first = data.data[0];
      for (const key of keys) {
        if (first[key] != null) return Number(first[key]);
      }
    }
  }
  return null;
}

function extractSleepDuration(data) {
  if (!data) return null;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { return null; }
  }
  // Try common field names for duration in seconds or minutes
  const secKeys = ['totalSleepSecs', 'sleepSecs', 'totalSleepDuration', 'duration', 'mainSleepDuration'];
  const minKeys = ['totalSleepMins', 'sleepMins', 'totalMinutes'];
  
  for (const key of secKeys) {
    const val = data[key] ?? data?.data?.[key];
    if (val != null) return Number(val);
  }
  for (const key of minKeys) {
    const val = data[key] ?? data?.data?.[key];
    if (val != null) return Number(val) * 60;
  }
  return null;
}

// ── Status Checks ─────────────────────────────────────────────────────────────

export function isCorosConnected() {
  const tokens = getStoredTokens();
  return tokens != null && tokens.access_token != null;
}

export function disconnectCoros() {
  clearTokens();
  mcpSessionId = null;
  localStorage.removeItem(COROS_WELLNESS_CACHE_KEY);
}
