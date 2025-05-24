FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set environment variables for build
ARG NEXT_PUBLIC_API_URL=http://192.168.0.53:8000
ARG NEXT_PUBLIC_WS_URL=ws://192.168.0.53:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

EXPOSE 3000

CMD ["npm", "run", "dev"]