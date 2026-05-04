# Gunakan image Node.js versi terbaru (LTS)
FROM node:20-slim

# Install dependencies yang dibutuhkan untuk SQLite dan kompresi
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (termasuk yang dibutuhkan untuk production)
RUN npm install --omit=dev

# Copy seluruh source code
COPY . .

# Buat folder untuk database dan logs jika belum ada
RUN mkdir -p logs

# Bot ini tidak butuh port ekspos (hanya background worker)
# Namun kita set environment variabel default
ENV NODE_ENV=production
ENV TZ=Asia/Jakarta

# Jalankan bot secara langsung (tidak perlu PM2 di dalam Docker karena Docker punya restart policy)
CMD ["node", "bot.js"]
