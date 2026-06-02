FROM node:20-slim AS build

WORKDIR /app

ARG VITE_BACKEND_URL=http://localhost:4000
ARG VITE_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
