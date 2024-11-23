FROM ubuntu:22.04
RUN apt update -y && apt upgrade -y

ARG node_version=22.6.0

RUN apt install ffmpeg -y

RUN apt-get install --yes curl
RUN curl --silent --location https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install --yes nodejs
RUN apt-get install --yes build-essential

WORKDIR /app

COPY . .

RUN npm ci

CMD ["npm", "run", "dev:job"]