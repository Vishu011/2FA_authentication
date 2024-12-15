import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import User from "../models/user.js";

// Configure Passport.js local strategy
passport.use(
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" }, // Custom field names if needed
    async (username, password, done) => {
      try {
        // Find the user in the database
        const user = await User.findOne({ username });
        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        // Compare provided password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          return done(null, user); // Authentication successful
        } else {
          return done(null, false, { message: "Incorrect password" });
        }
      } catch (error) {
        return done(error); // Pass errors to Passport
      }
    }
  )
);

// Serialize user to save in session
passport.serializeUser((user, done) => {
  done(null, user.id); // Save user ID in the session
});

// Deserialize user to retrieve user details
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); // Retrieve user by ID
    done(null, user); // Provide user object to the request
  } catch (error) {
    done(error);
  }
});
