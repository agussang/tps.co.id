# use the official ubuntu image
FROM ubuntu:latest as base

WORKDIR /app/prasi

# Set timezone to Asia/Jakarta
ENV TZ=Asia/Jakarta
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update
RUN apt-get install git curl gnupg zip unzip -yq
RUN git config --global --add safe.directory /app/prasi/repo
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.1.20" && \
    ln -s $HOME/.bun/bin/bun /usr/local/bin/bun

RUN apt-get update
RUN apt-get install nodejs -yq
RUN npm install -g pm2

RUN PATH="/usr/lib/node_modules/npm/bin:$PATH"

COPY dockerzip .
RUN unzip -o dockerzip
RUN bun install
COPY . .

EXPOSE 3000/tcp
CMD [ "pm2-runtime", "bun run prod" ]
