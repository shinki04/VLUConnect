# Use the official Redis image as the base
FROM redis:8.4-alpine

# Expose the default Redis port
EXPOSE 6379

# Create configuration directory
RUN mkdir -p /usr/local/etc/redis

# Copy a custom Redis configuration file
COPY redis.conf /usr/local/etc/redis/redis.conf

# Run Redis server with the specified configuration
CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]