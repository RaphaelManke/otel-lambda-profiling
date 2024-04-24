FROM public.ecr.aws/lambda/nodejs:20.2024.04.22.19

# Copy function code
COPY lib/index.js ${LAMBDA_TASK_ROOT}
COPY lib/otel-layer/ ${LAMBDA_TASK_ROOT}/otel-layer

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]
