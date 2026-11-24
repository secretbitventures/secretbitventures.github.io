FROM ruby:3.4 AS build
WORKDIR /src
COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4
COPY . .
RUN JEKYLL_ENV=production bundle exec jekyll build --destination /site --disable-disk-cache

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /site /srv
EXPOSE 8080
