# Use the official Redis image as the base
FROM redis:8.4-alpine

# Expose the default Redis port
EXPOSE 6379

# Optionally, copy a custom Redis configuration file
# COPY redis.conf /usr/local/etc/redis/redis.conf
# CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]

# If no custom config, simply run Redis server
CMD ["redis-server"]