FROM node:18

WORKDIR /pp

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 5000

CMD [ "node", "index.js" ]
