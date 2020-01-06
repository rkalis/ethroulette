# BUILD IMAGE
FROM node:10 as build

WORKDIR /app

# Install and cache app dependencies
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
RUN yarn

# Add app
COPY . /app

# Generate build
RUN yarn ng build --prod

###############################################################################

# PROD IMAGE
FROM nginx:1.17.0-alpine

# Copy build artifacts from the 'build environment'
COPY --from=build /app/dist /usr/share/nginx/html
