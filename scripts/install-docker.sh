#!/usr/bin/env bash
set -e

echo "==> Docker Installer for Ubuntu (Official Repo)"

# ---- Safety Check ----
if ! grep -qi ubuntu /etc/os-release; then
  echo "This script is for Ubuntu only."
  exit 1
fi

# ---- Remove old versions ----
echo "==> Removing old Docker versions (if any)"
sudo apt remove -y docker docker-engine docker.io containerd runc || true

# ---- Install prerequisites ----
echo "==> Installing prerequisites"
sudo apt update
sudo apt install -y ca-certificates curl gnupg

# ---- Add Docker GPG key ----
echo "==> Adding Docker GPG key"
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# ---- Add Docker repo ----
echo "==> Adding Docker repository"
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# ---- Install Docker ----
echo "==> Installing Docker Engine + Compose v2"
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ---- Enable and start Docker ----
echo "==> Enabling Docker service"
sudo systemctl enable docker
sudo systemctl start docker

# ---- Add user to docker group ----
echo "==> Adding $USER to docker group"
sudo usermod -aG docker $USER

# ---- Verification ----
echo "==> Verifying installation"
docker --version
docker compose version

echo ""
echo "Docker installation complete."
echo "IMPORTANT: Log out and back in (or run: newgrp docker)"
echo "Then test with: docker run hello-world"
