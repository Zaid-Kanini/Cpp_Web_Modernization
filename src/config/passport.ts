import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { JwtPayload } from '../types/auth.types';
import { ACCESS_TOKEN_COOKIE_NAME } from '../utils/cookie.utils';
import { prisma } from '../lib/prisma';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET is not configured in environment variables');
}

const cookieExtractor = (req: any): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies[ACCESS_TOKEN_COOKIE_NAME];
  }
  return token;
};

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    cookieExtractor,
  ]),
  secretOrKey: ACCESS_TOKEN_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id: payload.user_id },
        select: {
          user_id: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          is_active: true,
        },
      });

      if (!user) {
        return done(null, false);
      }

      if (!user.is_active) {
        return done(null, false);
      }

      return done(null, payload);
    } catch (error) {
      return done(error, false);
    }
  })
);

export default passport;
