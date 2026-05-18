import { clerkClient, getAuth } from "@clerk/express";
import userModel from "../models/userModel.js";

const protect = async (req, res, next) => {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(500).json({
        message: "Clerk is not configured. Add CLERK_SECRET_KEY in backend/.env",
      });
    }

    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authorized, no Clerk session" });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return res.status(400).json({
        message: "Your Clerk account needs an email address to use customer features",
      });
    }

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      email.split("@")[0];

    const normalizedEmail = email.toLowerCase();
    let user = await userModel.findOne({ clerkId: userId }).select("-password");

    if (!user) {
      const existingUser = await userModel.findOne({ email: normalizedEmail }).select("-password");

      if (existingUser) {
        existingUser.clerkId = userId;
        existingUser.name = existingUser.name || name;
        existingUser.email = normalizedEmail;
        user = await existingUser.save();
      } else {
        user = await userModel.create({
          clerkId: userId,
          name,
          email: normalizedEmail,
        });
      }
    } else if (user.email !== normalizedEmail || user.name !== name) {
      user.email = normalizedEmail;
      user.name = name;
      user = await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Clerk auth error:", error);
    res.status(401).json({ message: "Not authorized, Clerk token failed" });
  }
};

export default protect;
