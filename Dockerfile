FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
COPY style.css /usr/share/nginx/html/style.css
COPY script.js /usr/share/nginx/html/script.js
COPY taxCalculator.js /usr/share/nginx/html/taxCalculator.js
COPY favicon.ico /usr/share/nginx/html/favicon.ico

EXPOSE 80
