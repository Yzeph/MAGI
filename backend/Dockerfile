FROM node:20-alpine

# 安装基础构建工具 (某些原生依赖如 better-sqlite3 需要在 alpine 编译)
RUN apk add --no-cache python3 make g++ sqlite

# 创建应用目录
WORKDIR /app

# 复制 package.json 和 lock
COPY package*.json ./

# 安装依赖 
# (如果 better-sqlite3 不能获取预编译 alpine 包，上述的 apk 依赖将支持其本地编译)
RUN npm install

# 复制其余源代码
COPY . .

# 暴露端口
EXPOSE 3000
EXPOSE 3001

# 启动服务
CMD ["npm", "run", "start"]
