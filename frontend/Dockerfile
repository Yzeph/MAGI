# 第一阶段：构建前端 SPA 应用
FROM node:20-alpine AS build-stage

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# 生产环境构建命令
RUN npm run build

# 第二阶段：通过 Nginx 部署
FROM nginx:alpine AS production-stage

# 把刚才打包生成的 dist 转移到 nginx 发布目录下
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 配置 nginx（需要覆盖默认配置以实现前后端代理并解决 history 路由刷新 404问题）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
