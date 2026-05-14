import productModel from "../models/productModel.js";
import reviewModel from "../models/reviewModel.js";
import Order from "../models/orderModel.js";
import sellerModel from "../models/sellerModel.js";

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

const productiveResponseRules = `
Answer like a practical ecommerce operator, not a generic chatbot.
Use this format when possible:
1. Quick read: 1-2 sentences with the main takeaway.
2. Priority actions: 3-5 specific actions ordered by impact.
3. Watch-outs: risks, missing data, or decisions that need a human.
Use product names, prices, stock, ratings, order status, and review details from the context.
Do not invent products, sales, stock, reviews, or policies that are not in the context.
Keep the answer concise, but make it immediately useful.
`;

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
  rejectionReason: product.rejectionReason,
});

const countBy = (items, field) =>
  items.reduce((counts, item) => {
    const key = item[field] || "UNKNOWN";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

const sumSellerOrderRevenue = (orders, sellerId) =>
  orders.reduce((total, order) => {
    const sellerItems = order.orderItems.filter(
      (item) => String(item.sellerId) === String(sellerId)
    );

    return (
      total +
      sellerItems.reduce(
        (orderTotal, item) => orderTotal + Number(item.price || 0) * Number(item.quantity || 0),
        0
      )
    );
  }, 0);

const getSellerIdsForAdmin = async (admin) => {
  const sellers = await sellerModel
    .find({
      $or: [
        { createdByAdminId: admin._id },
        { createdByAdminEmail: admin.email },
      ],
    })
    .select("_id");

  return sellers.map((seller) => seller._id);
};

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
      max_output_tokens: 900,
      temperature: 0.4,
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
          maxOutputTokens: 900,
          temperature: 0.4,
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
      max_tokens: 900,
      temperature: 0.4,
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
      instructions: `You are a helpful ecommerce shopping assistant. Recommend products only from the provided context. Help the user choose quickly by balancing price, rating, category, stock, and their recent order pattern. If the context does not contain enough products, say exactly what information is missing.
${productiveResponseRules}`,
      question,
      context: {
        user: { name: req.user.name, email: req.user.email },
        catalogSummary: {
          availableProductCount: products.length,
          categories: [...new Set(products.map((product) => product.category).filter(Boolean))],
          priceRange: products.length
            ? {
                min: Math.min(...products.map((product) => Number(product.price || 0))),
                max: Math.max(...products.map((product) => Number(product.price || 0))),
              }
            : null,
        },
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
      instructions: `You are an ecommerce seller growth assistant. Focus on growth, stock protection, listing quality, customer complaints, and order follow-up. Give actions a seller can do today, not generic advice.
${productiveResponseRules}`,
      question,
      context: {
        seller: { name: req.seller.name, email: req.seller.email },
        sellerSummary: {
          productCount: products.length,
          pendingProducts: products.filter((product) => product.status === "Pending").length,
          approvedProducts: products.filter((product) => product.status === "Approved").length,
          rejectedProducts: products.filter((product) => product.status === "Rejected").length,
          lowStockProducts: products.filter(
            (product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 15
          ).length,
          outOfStockProducts: products.filter((product) => Number(product.stock || 0) <= 0).length,
          orderStatusCounts: countBy(orders, "status"),
          estimatedRecentRevenue: sumSellerOrderRevenue(orders, req.seller._id),
          reviewCount: reviews.length,
          negativeReviewCount: reviews.filter((review) => Number(review.rating || 0) <= 2).length,
        },
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

    const sellerIds = await getSellerIdsForAdmin(req.admin);
    const adminProducts = await productModel
      .find({ sellerId: { $in: sellerIds } })
      .select("_id");
    const adminProductIds = adminProducts.map((product) => product._id);

    const [pendingProducts, lowStockProducts, recentOrders, recentReviews] = await Promise.all([
      productModel
        .find({ status: "Pending", sellerId: { $in: sellerIds } })
        .select("name category subCategory price stock sellerName sellerEmail averageRating totalReviews createdAt")
        .sort({ createdAt: -1 })
        .limit(20),
      productModel
        .find({ status: "Approved", stock: { $gt: 0, $lte: 15 }, sellerId: { $in: sellerIds } })
        .select("name category subCategory price stock sellerName")
        .sort({ stock: 1 })
        .limit(20),
      Order.find({ "orderItems.sellerId": { $in: sellerIds } })
        .select("totalPrice status paymentStatus managedBy createdAt")
        .sort({ createdAt: -1 })
        .limit(25),
      reviewModel
        .find({ productId: { $in: adminProductIds } })
        .populate("productId", "name sellerName")
        .select("productId rating comment createdAt")
        .sort({ createdAt: -1 })
        .limit(25),
    ]);

    const result = await askAI({
      instructions: `You are an ecommerce admin operations assistant. Prioritize seller approvals, stock risks, order issues, review risks, and admin follow-up. Only advise; do not approve, reject, or modify anything yourself.
${productiveResponseRules}`,
      question,
      context: {
        admin: { email: req.admin.email },
        adminSummary: {
          pendingProductCount: pendingProducts.length,
          lowStockProductCount: lowStockProducts.length,
          recentOrderStatusCounts: countBy(recentOrders, "status"),
          recentPaymentStatusCounts: countBy(recentOrders, "paymentStatus"),
          recentReviewCount: recentReviews.length,
          negativeReviewCount: recentReviews.filter((review) => Number(review.rating || 0) <= 2).length,
        },
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
