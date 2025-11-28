FROM rabbitmq:4.1.2-management-alpine

# Expose AMQP port
EXPOSE 5672

# Expose Management UI port
EXPOSE 15672

# Set default user/password (can be overridden via environment)
ENV RABBITMQ_DEFAULT_USER=guest
ENV RABBITMQ_DEFAULT_PASS=guest

# Enable plugins management
# RUN rabbitmq-plugins enable rabbitmq_management

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=5 \
    CMD rabbitmq-diagnostics -q ping
