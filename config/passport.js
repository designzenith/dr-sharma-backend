const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");

const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase().trim();

        if (!email) {
          return done(new Error("Google account does not have an email"), null);
        }

        const name =
          profile.displayName ||
          `${profile.name?.givenName || ""} ${
            profile.name?.familyName || ""
          }`.trim();

        // ==========================================
        // Find existing user
        // ==========================================

        let user = await User.findOne({
          email,
        });

        // ==========================================
        // Create new user
        // ==========================================

        if (!user) {
          user = await User.create({
            name,
            email,
            phone: "",
            password: undefined,
            role: "patient",
            googleId: profile.id,
            profileImage: profile.photos?.[0]?.value || "",
          });
        } else {
          // Save Google ID if user already exists
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
        }

        // ==========================================
        // Create JWT
        // ==========================================

        const token = jwt.sign(
          {
            id: user._id,
            role: user.role,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "7d",
          },
        );

        return done(null, {
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profileImage: user.profileImage,
          },
        });
      } catch (error) {
        console.error("Google OAuth Error:", error);

        return done(error, null);
      }
    },
  ),
);

module.exports = passport;
