import bcrypt from "bcryptjs";
import User from "../models/user.js";
import speakeasy from "speakeasy";
import qrCode from "qrcode"; // Correct import for QR code generation
import jwt from "jsonwebtoken";

// Register a new user
export const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already taken" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the user
        const newUser = new User({
            username,
            password: hashedPassword,
            isMfaActive: false,
        });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering the user:", error.message);
        res.status(500).json({ error: "Error registering the user", message: error.message });
    }
};

// Log in an existing user
export const login = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized User" });
    }

    res.status(200).json({
        message: "User logged in successfully",
        username: req.user.username,
        isMfaActive: req.user.isMfaActive,
    });
};

// Check authentication status
export const authStatus = async (req, res) => {
    if (req.user) {
        res.status(200).json({
            message: "User is authenticated",
            username: req.user.username,
            isMfaActive: req.user.isMfaActive,
        });
    } else {
        res.status(401).json({ message: "Unauthorized User" });
    }
};

// Log out the user
export const logout = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized User" });

    req.logout((err) => {
        if (err) return res.status(400).json({ message: "User not logged in" });
        res.status(200).json({ message: "User logged out successfully" });
    });
};

// Setup 2FA for the user
export const setup2FA = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized User" });
        }

        const user = req.user;

        // Generate a new 2FA secret
        const secret = speakeasy.generateSecret();
        user.twoFactorSecret = secret.base32; // Store the base32 encoded secret

        // Generate QR code for the secret
        const qrCodeUrl = await qrCode.toDataURL(secret.otpauth_url);

        // Save the user with the updated secret
        await user.save();

        res.status(200).json({
            message: "2FA setup successful",
            qrCodeUrl,
            secret: secret.base32,
        });
    } catch (error) {
        console.error("Error setting up 2FA:", error.message);
        res.status(500).json({ error: "Error setting up 2FA", message: error.message });
    }
};

// Verify 2FA code
export const verify2FA = async (req, res) => {
    try {
        const { token } = req.body;

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized User" });
        }

        const isValid = speakeasy.totp.verify({
            secret: req.user.twoFactorSecret,
            encoding: "base32",
            token,
        });

        if (isValid) {
            req.user.isMfaActive = true;
            await req.user.save();
            res.status(200).json({ message: "2FA verification successful" });
        } else {
            res.status(400).json({ error: "Invalid 2FA token" });
        }
    } catch (error) {
        console.error("Error verifying 2FA:", error.message);
        res.status(500).json({ error: "Error verifying 2FA", message: error.message });
    }
};

// Reset 2FA for the user
export const reset2FA = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized User" });
        }

        req.user.twoFactorSecret = null;
        req.user.isMfaActive = false;
        await req.user.save();

        res.status(200).json({ message: "2FA has been reset successfully" });
    } catch (error) {
        console.error("Error resetting 2FA:", error.message);
        res.status(500).json({ error: "Error resetting 2FA", message: error.message });
    }
};
