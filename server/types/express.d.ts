import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string | null;
      username: string | null;
      subscriptionTier: string;
      subscriptionStatus: string;
      subscriptionExpiry?: Date | null;
      isAdmin: boolean;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
      firebaseUid?: string | null;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData>;
    }
  }
}
