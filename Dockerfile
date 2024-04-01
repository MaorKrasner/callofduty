FROM node:18

WORKDIR /dist

COPY . .

RUN npm install

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "docker-start"]