docker build -t otel-lambda .
docker run --rm --platform linux/arm64 -p 9000:8080 otel-lambda
sleep 1
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{"payload":"hello world!"}'