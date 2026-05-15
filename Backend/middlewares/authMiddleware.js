import jwt from "jsonwebtoken";
import Client from "../models/client.js";
import { OAuth2Client } from "google-auth-library";

let googleClient;

const authenticateClient = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.includes("Bearer ") 
    ? authHeader.replace("Bearer ", "") 
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    // 1. Try local JWT verification first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        ...decoded,
        stayHostVerified: Boolean(decoded.stayHostVerified),
      };
      return next();
    } catch (localErr) {
      // 2. If local verification fails, check if it's a Google ID Token
      try {
        if (!googleClient) {
          googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        }
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, phone_number, name } = payload;

        // Find or create user in our database
        let client = await Client.findOne({
          where: email ? { email } : { phone: phone_number || "" }
        });

        if (!client) {
          // If the user doesn't exist, we provide the payload enough to register him.
          req.user = {
            firebaseOnly: true, // Legacy flag, but still useful to denote incomplete registration
            email: email,
            name: name,
          };
          return next();
        }

        req.user = {
          client_id: client.client_id,
          phone: client.phone,
          email: client.email,
          userType: client.userType,
          stayHostVerified: client.stayHostVerified,
          unique_code: client.unique_code,
        };
        return next();
      } catch (googleErr) {
        console.error("Google verify error:", googleErr.message);
        
        // --- LOCAL DEV FALLBACK ---
        // If Google's HTTPS cert verification fails locally, we gracefully decode the payload manually
        const dbMode = (process.env.DB_MODE || "").trim();
        console.log(`[AuthFallback] DB_MODE is: '${dbMode}'`);

        if (dbMode === "local") {
            try {
                console.log("[AuthFallback] Attempting manual JWT decode...");
                const decodedPayload = jwt.decode(token);
                
                if (decodedPayload && decodedPayload.email) {
                    console.log(`[AuthFallback] Decoded email: ${decodedPayload.email}. Searching DB...`);
                    const existingClient = await Client.findOne({ where: { email: decodedPayload.email } });
                    
                    if (existingClient) {
                        console.log(`[AuthFallback] User found in DB. Logging in as: ${existingClient.name}`);
                        req.user = {
                          client_id: existingClient.client_id,
                          phone: existingClient.phone,
                          email: existingClient.email,
                          userType: existingClient.userType,
                          stayHostVerified: existingClient.stayHostVerified,
                          unique_code: existingClient.unique_code,
                        };
                        return next();
                    } else {
                        console.log(`[AuthFallback] User not in DB. Proceeding to registration.`);
                        req.user = { firebaseOnly: true, email: decodedPayload.email, name: decodedPayload.name };
                        return next();
                    }
                } else {
                    console.log("[AuthFallback] JWT decode failed or no email found in payload.");
                }
            } catch (fallbackErr) {
                console.error("[AuthFallback] Crash during fallback execution:", fallbackErr);
            }
        }
        
        return res.status(401).json({ message: "Google Auth Failed: " + googleErr.message });
      }
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token or unauthorized" });
  }
};

export default authenticateClient;
