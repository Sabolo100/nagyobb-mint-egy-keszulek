FROM nginx:alpine
ARG SOURCE_COMMIT=dev
COPY site /usr/share/nginx/html
# service worker cache-verzió (a GitHub Pages workflow ugyanezt csinálja)
RUN sed -i "s/__BUILD__/$(echo ${SOURCE_COMMIT} | cut -c1-8)/" /usr/share/nginx/html/app/sw.js
EXPOSE 80
