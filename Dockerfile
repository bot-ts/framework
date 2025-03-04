# Choose the base image according to the runtime

FROM oven/bun:latest


# Set the working directory
WORKDIR /app

# Copy the necessary files for dependency installation
COPY package.json .

# Install dependencies based on the package manager

RUN bun install


# Copy the remaining files into the container
COPY . .

# Build and run command

CMD ["bun", "run", "start"]

