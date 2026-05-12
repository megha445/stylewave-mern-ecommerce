import productModel from "../models/productModel.js";
import reviewModel from "../models/reviewModel.js";
import Order from "../models/orderModel.js";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const getAIProvider = () => (process.env.AI_PROVIDER || "gemini").toLowerCase();
const getAIModel = () => {
  const provider = getAIProvider();
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (provider === "groq") return "llama-3.1-8b-instant";
  if (provider === "openai") return process.env.OPENAI_MODEL || "gpt-5-mini";
  return "gemini-1.5-flash";
};

const cleanQuestion = (question) => {
  if (!question || typeof question !== "string") return "";
  return question.trim().slice(0, 700);
};

const compactProduct = (product) => ({
  id: product._id,
  name: product.name,
  category: product.category,
  subCategory: product.subCategory,
  price: product.price,
  stock: product.stock,
  status: product.status,
  sellerName: product.sellerName,
  averageRating: product.averageRating,
  totalReviews: product.totalReviews,
});

const extractOutputText = (data) => {
  if (data.output_text) return data.output_text;

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
};

const askOpenAI = async ({ instructions, question, context }) => {
  if (!process.env.OPENAI_API_KEY) {
    return {
      success: false,
      message: "OPENAI_API_KEY is missing in backend/.env. Add it and restart the backend.",
    };
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getAIModel(),
      instructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Question: ${question}\n\nContext JSON:\n${JSON.stringify(context, null, 2)}`,
            },
          ],
        },
      ],
      max_output_tokens: 700,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      message: data.error?.message || "AI request failed",
    };
  }

  return {
    success: true,
    answer: extractOutputText(data) || "No answer returned.",
  };
};

const extractGeminiText = (data) =>
  (data.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();

const askGemini = async ({ instructions, question, context }) => {
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      message: "GEMINI_API_KEY is missing in backend/.env. Add it and restart the backend.",
    };
  }

  const model = getAIModel();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: instructions }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Question: ${question}\n\nContext JSON:\n${JSON.stringify(context, null, 2)}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 700,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      message: data.error?.message || "Gemini request failed",
    };
  }

  return {
    success: true,
    answer: extractGeminiText(data) || "No answer returned.",
  };
};

const askGroq = async ({ instructions, question, context }) => {
  if (!process.env.GROQ_API_KEY) {
    return {
      success: false,
      message: "GROQ_API_KEY is missing in backend/.env. Add it and restart the backend.",
    };
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getAIModel(),
      messages: [
        { role: "system", content: instructions },
        {
          role: "user",
          content: `Question: ${question}\n\nContext JSON:\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      max_tokens: 700,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      message: data.error?.message || "Groq request failed",
    };
  }

  return {
    success: true,
    answer: data.choices?.[0]?.message?.content || "No answer returned.",
  };
};

const askAI = async (payload) => {
  const provider = getAIProvider();
  if (provider === "groq") return askGroq(payload);
  if (provider === "openai") return askOpenAI(payload);
  return askGemini(payload);
};

export const userShoppingAssistant = async (req, res) => {
  try {
    const question = cleanQuestion(req.body.question);
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const [products, orders] = await Promise.all([
      productModel
        .find({ status: "Approved", stock: { $gt: 0 } })
        .select("name category subCategory price stock averageRating totalReviews")
        .sort({ bestSeller: -1, averageRating: -1, totalReviews: -1 })
        .limit(20),
      Order.find({ userId: req.user._id })
        .select("orderItems totalPrice status createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const result = await askAI({
      instructions:
        "You are a helpful ecommerce shopping assistant. Recommend products only from the provided context. Be concise, practical, and mention price/category when useful. If the context does not contain enough products, say what information is missing.",
      question,
      context: {
        user: { name: req.user.name, email: req.user.email },
        availableProducts: products.map(compactProduct),
        recentOrders: orders.map((order) => ({
          status: order.status,
          totalPrice: order.totalPrice,
          items: order.orderItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            size: item.size,
          })),
        })),
      },
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("User AI assistant error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sellerInsightsAssistant = async (req, res) => {
  try {
    const question = cleanQuestion(req.body.question);
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const products = await productModel
      .find({ sellerId: req.seller._id })
      .select("name category subCategory price stock status averageRating totalReviews rejectionReason")
      .sort({ updatedAt: -1 })
      .limit(25);

    const reviews = await reviewModel
      .find({ productId: { $in: products.map((product) => product._id) } })
      .populate("productId", "name")
      .select("productId rating comment createdAt")
      .sort({ createdAt: -1 })
      .limit(30);

    const orders = await Order.find({ "orderItems.sellerId": req.seller._id })
      .select("orderItems totalPrice status paymentStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(20);

    const result = await askAI({
      instructions:
        "You are an ecommerce seller growth assistant. Give practical insights about product quality, reviews, low stock, order status, and product listing improvements. Keep advice specific to the supplied seller data.",
      question,
      context: {
        seller: { name: req.seller.name, email: req.seller.email },
        products: products.map(compactProduct),
        recentReviews: reviews.map((review) => ({
          product: review.productId?.name,
          rating: review.rating,
          comment: review.comment,
        })),
        recentOrders: orders.map((order) => ({
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalPrice: order.totalPrice,
          items: order.orderItems
            .filter((item) => String(item.sellerId) === String(req.seller._id))
            .map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
        })),
      },
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Seller AI assistant error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminInsightsAssistant = async (req, res) => {
  try {
    const question = cleanQuestion(req.body.question);
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const [pendingProducts, lowStockProducts, recentOrders, recentReviews] = await Promise.all([
      productModel
        .find({ status: "Pending" })
        .select("name category subCategory price stock sellerName sellerEmail averageRating totalReviews createdAt")
        .sort({ createdAt: -1 })
        .limit(20),
      productModel
        .find({ status: "Approved", stock: { $gt: 0, $lte: 15 } })
        .select("name category subCategory price stock sellerName")
        .sort({ stock: 1 })
        .limit(20),
      Order.find({})
        .select("totalPrice status paymentStatus managedBy createdAt")
        .sort({ createdAt: -1 })
        .limit(25),
      reviewModel
        .find({})
        .populate("productId", "name sellerName")
        .select("productId rating comment createdAt")
        .sort({ createdAt: -1 })
        .limit(25),
    ]);

    const result = await askAI({
      instructions:
        "You are an ecommerce admin operations assistant. Help prioritize approvals, detect product or review risks, summarize platform health, and suggest next admin actions. Do not approve or reject anything yourself; provide decision support only.",
      question,
      context: {
        admin: { email: req.admin.email },
        pendingProducts: pendingProducts.map(compactProduct),
        lowStockProducts: lowStockProducts.map(compactProduct),
        recentOrders: recentOrders.map((order) => ({
          status: order.status,
          paymentStatus: order.paymentStatus,
          managedBy: order.managedBy,
          totalPrice: order.totalPrice,
        })),
        recentReviews: recentReviews.map((review) => ({
          product: review.productId?.name,
          sellerName: review.productId?.sellerName,
          rating: review.rating,
          comment: review.comment,
        })),
      },
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Admin AI assistant error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
