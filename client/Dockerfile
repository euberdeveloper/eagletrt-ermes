FROM node:15-slim
WORKDIR /client
COPY package*.json ./
RUN npm i
COPY . .
CMD [ "npm", "start" ] 