import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "StyleWave E-Commerce API",
      version: "1.0.0",
      description: "Complete API documentation for StyleWave Multi-Vendor E-Commerce Platform",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
    ],
    // ✅ ADD THIS — enables the Authorize button in Swagger UI
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Use a Bearer token. Customer routes accept Clerk session tokens; admin and seller routes accept app-issued JWTs.",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
