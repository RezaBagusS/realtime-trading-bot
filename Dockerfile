# Gunakan image Node.js versi 20 (Full version untuk kompilasi native module)
FROM node:20

# Install dependencies yang dibutuhkan untuk build native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies dan paksa build dari source untuk native modules (sqlite3)
# Ini penting untuk menghindari error GLIBC pada arsitektur ARM/M1/M2
RUN npm install --omit=dev --build-from-source

# Copy seluruh source code
COPY . .

# Buat folder untuk database dan logs jika belum ada
RUN mkdir -p logs

# Set environment
ENV NODE_ENV=production
ENV TZ=Asia/Jakarta

# Jalankan bot
CMD ["node", "bot.js"]
