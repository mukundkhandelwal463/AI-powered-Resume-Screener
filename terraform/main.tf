# ==============================================================
# AI Resume Screener — Terraform Infrastructure (AWS)
# Provisions: EC2 Instance + Security Group
# ==============================================================
# How to use:
#   cd terraform/
#   terraform init
#   terraform plan
#   terraform apply        ← type "yes" when prompted
#   terraform output       ← see URLs
#   terraform destroy      ← tear down to stop billing
# ==============================================================

# ── Provider ──────────────────────────────────────────────────
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5.0"
}

provider "aws" {
  region = var.aws_region
}

# ── Variables ─────────────────────────────────────────────────
variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "ap-south-1"   # Mumbai — matches your AWS CLI config
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.medium"   # 2 vCPU, 4GB RAM — needed for ML + Gunicorn workers
}

variable "key_name" {
  description = "Name of your AWS EC2 Key Pair for SSH access"
  type        = string
  default     = "resume-screener-key"
}

variable "gemini_api_key" {
  description = "Google Gemini API key (sensitive)"
  type        = string
  sensitive   = true
  default     = ""   # Set via TF_VAR_gemini_api_key env var or terraform.tfvars
}

# ── Security Group (Firewall Rules) ───────────────────────────
resource "aws_security_group" "resume_sg" {
  name        = "resume-screener-sg"
  description = "Security group for AI Resume Screener server"

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Flask Backend API
  ingress {
    description = "Flask Backend"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Nginx (React Frontend)
  ingress {
    description = "HTTP Frontend"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # React dev server (Docker Compose maps 3000)
  ingress {
    description = "React via Docker"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus UI
  ingress {
    description = "Prometheus"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Grafana UI
  ingress {
    description = "Grafana"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "resume-screener-sg"
    Project = "AI-Resume-Screener"
  }
}

# ── Latest Amazon Linux 2023 AMI (auto-detected per region) ───
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── EC2 Instance ───────────────────────────────────────────────
resource "aws_instance" "resume_server" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.resume_sg.id]

  # Root volume — 20GB is enough for Docker images + resume files
  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  # Startup script — runs ONCE when EC2 first launches
  user_data = <<-EOF
    #!/bin/bash
    set -e

    echo "=== AI Resume Screener Server Setup ==="
    dnf update -y

    # Install Docker
    dnf install docker -y
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user

    # Install Docker Compose v2
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
         -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Install Git
    dnf install git -y

    # Clone the project
    git clone https://github.com/mukundkhandelwal463/AI-powered-Resume-Screener.git /app
    cd /app

    # Create .env file from secrets (replace with real values)
    cat > backend/.env << 'ENVFILE'
    GEMINI_API_KEY=${var.gemini_api_key}
    SMTP_SERVER=smtp.gmail.com
    SMTP_PORT=587
    SECRET_KEY=airesume-secret-key-2026
    FLASK_ENV=production
    ENVFILE

    # Start all services
    docker-compose up -d --build

    echo "=== Setup Complete ==="
    docker-compose ps
  EOF

  tags = {
    Name    = "ai-resume-screener-server"
    Project = "AI-Resume-Screener"
  }
}

# ── Outputs — displayed after terraform apply ─────────────────
output "server_public_ip" {
  description = "Public IP of the EC2 server"
  value       = aws_instance.resume_server.public_ip
}

output "frontend_url" {
  description = "React Frontend URL"
  value       = "http://${aws_instance.resume_server.public_ip}:3000"
}

output "backend_url" {
  description = "Flask Backend API URL"
  value       = "http://${aws_instance.resume_server.public_ip}:5000"
}

output "prometheus_url" {
  description = "Prometheus UI URL"
  value       = "http://${aws_instance.resume_server.public_ip}:9090"
}

output "grafana_url" {
  description = "Grafana Dashboard URL (admin / resume123)"
  value       = "http://${aws_instance.resume_server.public_ip}:3001"
}

output "ssh_command" {
  description = "SSH command to access the server"
  value       = "ssh -i ${var.key_name}.pem ec2-user@${aws_instance.resume_server.public_ip}"
}
