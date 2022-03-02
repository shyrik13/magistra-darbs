FROM rust:1.50

WORKDIR /var/www/project/core/wasm

# setup
RUN apt-get update && apt-get upgrade -qy && \
    apt-get install -y --no-install-recommends \
    curl git openssl libssl-dev ca-certificates \
    build-essential python python3 cmake && \
    apt-get clean && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/*

# emscripten
# requirements 1.37.0 or higher
RUN mkdir /emscripten && cd /emscripten && \
    git clone https://github.com/emscripten-core/emsdk.git && ls -l && cd emsdk && \
    git pull && ./emsdk install latest && ./emsdk activate latest && \
    /bin/bash ./emsdk_env.sh && \
    echo "source /emscripten/emsdk/emsdk_env.sh" > /root/.bashrc

RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Rust
ENV PATH /root/.cargo/bin:$PATH
RUN rustup install stable \
    && rustup component add rust-src \
    && rustup target add wasm32-unknown-emscripten \
    && rustup target add asmjs-unknown-emscripten \
    && rustup install nightly \
    && rustup component add rust-src --toolchain nightly \
    && rustup target add asmjs-unknown-emscripten --toolchain nightly \
    && rustup target add wasm32-unknown-emscripten --toolchain nightly \
    && rustup default nightly