import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists by google_id
          let user = await prisma.user.findUnique({
            where: { google_id: profile.id },
          });

          if (!user) {
            // Check if email already registered via local auth
            const email = profile.emails?.[0]?.value || '';
            const existingEmail = await prisma.user.findUnique({
              where: { email },
            });

            if (existingEmail) {
              // Link google account to existing email
              user = await prisma.user.update({
                where: { email },
                data: {
                  google_id: profile.id,
                  auth_provider: 'GOOGLE',
                  avatar_url: profile.photos?.[0]?.value,
                },
              });
            } else {
              // Create new user
              user = await prisma.user.create({
                data: {
                  email: email,
                  full_name: profile.displayName,
                  google_id: profile.id,
                  auth_provider: 'GOOGLE',
                  avatar_url: profile.photos?.[0]?.value,
                },
              });
            }
          }
          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;
