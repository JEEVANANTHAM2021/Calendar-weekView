export interface UserDTO {
  id: string;
  email: string;
  name: string;
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
 
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('VITE_API_URL is not set');
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<UserDTO> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const data = await handleJson<{ user: UserDTO }>(res);
  return data.user;
}

export async function login(
  email: string,
  password: string
): Promise<UserDTO> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await handleJson<{ user: UserDTO }>(res);
  return data.user;
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  await handleJson(res);
}

export async function getMe(): Promise<UserDTO | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });
  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  const data = (await res.json()) as { user: UserDTO };
  return data.user;
}

