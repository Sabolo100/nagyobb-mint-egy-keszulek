FROM nginx:alpine
COPY site /usr/share/nginx/html
# service worker cache-verzió: az app fájljainak tartalom-hash-éből (a GitHub Pages workflow a commit azonosítóját használja)
RUN cd /usr/share/nginx/html && V=$(cat app/*.js app/*.css app/index.html js/*.js css/*.css index.html | md5sum | cut -c1-8) && sed -i "s/__BUILD__/$V/" app/sw.js
EXPOSE 80
