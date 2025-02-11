# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package.json和pnpm-lock.yaml（如果存在）
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "run", "dev"] 