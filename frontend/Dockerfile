FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY frontend/style.css frontend/script.js /usr/share/nginx/html/
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
