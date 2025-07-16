import { Request, Response, NextFunction } from 'express';

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Forbidden' });
}