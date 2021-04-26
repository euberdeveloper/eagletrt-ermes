FROM node:15-slim
WORKDIR /server
COPY package*.json ./
RUN npm i
COPY . .
CMD [ "npm", "start" ] 