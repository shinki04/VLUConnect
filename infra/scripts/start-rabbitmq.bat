@echo off
echo 🚀 Starting RabbitMQ...

docker run -d ^
  --name rabbitmq_dev ^
  -p 5672:5672 ^
  -p 15672:15672 ^
  -e RABBITMQ_DEFAULT_USER=guest ^
  -e RABBITMQ_DEFAULT_PASS=guest ^
  rabbitmq:3.12-management-alpine

echo.
echo ⏳ Waiting for RabbitMQ to be ready...
timeout /t 10 /nobreak

echo.
echo ✅ RabbitMQ is ready!
echo 📊 Management UI: http://localhost:15672 (guest/guest)
echo.
echo Next steps:
echo 1. In another terminal: pnpm dev
echo 2. In another terminal: pnpm worker
echo.
pause
