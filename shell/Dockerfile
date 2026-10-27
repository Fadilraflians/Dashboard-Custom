# ---------- Build stage ----------
FROM jtl-tkgiharbor.hq.bni.co.id/govtech/ubi10/nodejs-24:10.1 AS builder

WORKDIR /opt/app-root/src

ENV NEXT_TELEMETRY_DISABLED=1

COPY .npmrc ./
RUN npm install -g pnpm
RUN pnpm config set dangerously-allow-all-builds true
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

RUN pnpm build

# ---------- Runtime stage ----------
FROM jtl-tkgiharbor.hq.bni.co.id/govtech/ubi10/nodejs-24:10.1

ARG APP_PORT=3000
ARG APP_FOLDER_NAME

WORKDIR /opt/app-root/src

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV TZ=Asia/Jakarta

COPY --from=builder /opt/app-root/src/.next/standalone ./
COPY --from=builder /opt/app-root/src/.next/static ./.next/static
COPY --from=builder /opt/app-root/src/public ./public

USER root

RUN for dir in $(echo "${APP_FOLDER_NAME}" | tr ',' ' '); do \
        mkdir -p "${dir}" && chgrp -R 0 "${dir}" && chmod -R g=u "${dir}"; \
    done

USER 1001
EXPOSE ${APP_PORT}
CMD ["node", "server.js"]