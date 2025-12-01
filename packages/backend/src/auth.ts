import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { UserModel, type UserDocument } from './models/user.model';

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? 'dev-secret';
// keep as string but we’ll cast it where needed
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

interface JwtPayload {
  sub: string;
  email: string;
}

export function signAccessToken(user: UserDocument) {
  const payload: JwtPayload = {
    sub: user._id.toString(),
    email: user.email,
  };

  // 👇 force the object to be treated as SignOptions
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

// EXPORT this interface
export interface AuthRequest extends Request {
  user?: UserDocument;
}

// EXPORT this function
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await UserModel.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('authMiddleware error', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}