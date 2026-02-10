# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# 设置 npm 镜像源，加速安装
RUN npm config set registry https://registry.npmmirror.com/

COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm (如果项目使用 pnpm)
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install

COPY . .

# 构建项目
RUN pnpm run build

# Serve stage
FROM nginx:alpine

# 复制构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
