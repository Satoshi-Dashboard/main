#!/usr/bin/env bash
#
# docker-publish.sh
# -----------------
# Builds a multi-architecture Docker image for Umbrel deployment and pushes it
# to Docker Hub. After pushing, it retrieves the manifest digest so you can pin
# the image in docker-compose.yml with a sha256 reference, which Umbrel requires.
#
# Prerequisites:
#   1. Docker Desktop (or Docker Engine) with BuildKit enabled.
#   2. A buildx builder that supports linux/amd64 and linux/arm64.
#      Create one if you haven't already:
#        docker buildx create --name multiarch --driver docker-container --use
#        docker buildx inspect --bootstrap
#   3. Logged in to Docker Hub:  docker login
#
# Usage:
#   ./scripts/docker-publish.sh            # uses default version v1.0.0
#   ./scripts/docker-publish.sh v1.2.3     # uses the supplied version tag

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

IMAGE_NAME="ghcr.io/ikhunsa/satoshi-dashboard"
VERSION="${1:-v1.0.0}"                     # accept version as first argument

# Full tags that will be applied to the image
TAG_VERSION="${IMAGE_NAME}:${VERSION}"
TAG_LATEST="${IMAGE_NAME}:latest"

# Target architectures required by Umbrel (amd64 for x86 servers, arm64 for
# Raspberry Pi 4/5 and Apple Silicon)
PLATFORMS="linux/amd64,linux/arm64"

echo "============================================"
echo "  Satoshi Dashboard -- Docker Publish"
echo "============================================"
echo ""
echo "  Image:      ${IMAGE_NAME}"
echo "  Version:    ${VERSION}"
echo "  Platforms:  ${PLATFORMS}"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Verify that a buildx builder is available
# ---------------------------------------------------------------------------
# docker buildx requires a builder instance that supports the requested
# platforms. If no suitable builder exists the build will fail, so we check
# early and give a helpful message.

echo "[1/4] Checking buildx builder..."

BUILDER=$(docker buildx ls 2>/dev/null | head -1 || true)
if [ -z "$BUILDER" ]; then
  echo "ERROR: No buildx builder found."
  echo "Create one with:"
  echo "  docker buildx create --name multiarch --driver docker-container --use"
  echo "  docker buildx inspect --bootstrap"
  exit 1
fi

echo "  Active builder: $(docker buildx ls | grep '\*' | awk '{print $1}')"
echo ""

# ---------------------------------------------------------------------------
# Step 2: Build the multi-arch image and push to Docker Hub
# ---------------------------------------------------------------------------
# buildx build with --push uploads each architecture layer directly to the
# registry and creates a multi-arch manifest list. This is the recommended
# workflow because multi-arch images cannot be stored in the local daemon.

echo "[2/4] Building multi-arch image and pushing to Docker Hub..."
echo "  Tags: ${TAG_VERSION}, ${TAG_LATEST}"
echo ""

docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${TAG_VERSION}" \
  --tag "${TAG_LATEST}" \
  --push \
  .

echo ""
echo "  Build and push complete."
echo ""

# ---------------------------------------------------------------------------
# Step 3: Retrieve the manifest digest
# ---------------------------------------------------------------------------
# Umbrel requires images to be pinned with a sha256 digest for reproducibility.
# The digest identifies the multi-arch manifest list (not a single platform),
# so every node pulls the correct architecture automatically.
#
# We use `docker buildx imagetools inspect` which queries the registry and
# returns the manifest list digest.

echo "[3/4] Retrieving manifest digest from registry..."
echo ""

# Capture the full output for display, then extract the digest line
INSPECT_OUTPUT=$(docker buildx imagetools inspect "${TAG_VERSION}" 2>&1)

# The digest line looks like: Digest: sha256:abc123...
DIGEST=$(echo "${INSPECT_OUTPUT}" | grep -E '^Digest:' | head -1 | awk '{print $2}')

if [ -z "$DIGEST" ]; then
  echo "WARNING: Could not automatically parse the digest."
  echo "Full inspect output:"
  echo "${INSPECT_OUTPUT}"
  echo ""
  echo "You can retrieve the digest manually with:"
  echo "  docker buildx imagetools inspect ${TAG_VERSION}"
  exit 1
fi

echo "  Digest: ${DIGEST}"
echo ""

# ---------------------------------------------------------------------------
# Step 4: Print the pinned image reference for docker-compose.yml
# ---------------------------------------------------------------------------
# This is the value you paste into the Umbrel app's docker-compose.yml to
# satisfy the pinned-image requirement.

PINNED_REF="${TAG_VERSION}@${DIGEST}"

echo "[4/4] Done! Pinned image reference:"
echo ""
echo "============================================"
echo "  ${PINNED_REF}"
echo "============================================"
echo ""
echo "Update your docker-compose.yml like so:"
echo ""
echo "  services:"
echo "    web:"
echo "      image: ${PINNED_REF}"
echo ""
echo "This ensures Umbrel pulls exactly this build on both amd64 and arm64."
