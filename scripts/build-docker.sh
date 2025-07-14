#!/bin/bash

# 构建和推送 Docker 镜像的本地脚本

set -e

# 配置变量
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="kazune"
IMAGE_NAME="kiwivm-dashboard"
VERSION=${1:-"latest"}

# 完整镜像名称
FULL_IMAGE_NAME="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"

echo "正在构建 Docker 镜像: ${FULL_IMAGE_NAME}"

# 构建 Docker 镜像
docker build -t "${FULL_IMAGE_NAME}" .

echo "镜像构建完成！"

# 询问是否推送
read -p "是否要推送镜像到阿里云容器镜像服务? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "正在推送镜像..."
    
    # 检查是否已登录
    if ! docker system info | grep -q "Registry"; then
        echo "请先登录到阿里云容器镜像服务:"
        echo "docker login ${REGISTRY}"
        exit 1
    fi
    
    # 推送镜像
    docker push "${FULL_IMAGE_NAME}"
    
    echo "镜像推送完成！"
    echo "镜像地址: ${FULL_IMAGE_NAME}"
else
    echo "跳过推送，镜像已在本地构建完成。"
    echo "本地镜像: ${FULL_IMAGE_NAME}"
fi
