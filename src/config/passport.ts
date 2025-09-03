import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserModel } from '../models/User';

export function configurePassport() {
  // Serialize user for the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await UserModel.findByGoogleId(profile.id);
      
      if (!user) {
        // Create new user if doesn't exist
        user = await UserModel.createFromGoogle({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          username: profile.emails?.[0]?.value?.split('@')[0] || profile.id,
          avatar: profile.photos?.[0]?.value || ''
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  return passport;
}
