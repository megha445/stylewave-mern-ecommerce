import crypto from "crypto";

export const getCloudinarySignature = async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary env vars missing",
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "products";

    // Cloudinary signature: sha1("folder=...&timestamp=...<api_secret>")
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

    return res.json({
      success: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

