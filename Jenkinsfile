pipeline {
    agent any

    environment {
        BACKEND_IMAGE = 'mukund463/resume-backend'
        FRONTEND_IMAGE = 'mukund463/resume-frontend'
    }

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/mukundkhandelwal463/AI-powered-Resume-Screener.git'
            }
        }

        stage('Build Backend Image') {
            steps {
                bat "docker build -f docker/Dockerfile.backend -t %BACKEND_IMAGE%:latest ."
            }
        }

        stage('Build Frontend Image') {
            steps {
                bat "docker build -f docker/Dockerfile.frontend -t %FRONTEND_IMAGE%:latest ."
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
                    bat 'docker login -u %DH_USER% -p %DH_PASS%'
                    bat "docker push %BACKEND_IMAGE%:latest"
                    bat "docker push %FRONTEND_IMAGE%:latest"
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                bat 'docker rm -f resume-backend resume-frontend resume-prometheus resume-grafana 2>nul || exit 0'
                bat 'docker network rm resume_screener_resume-network 2>nul || exit 0'
                bat 'docker network rm resume-screener-pipeline_resume-network 2>nul || exit 0'
                bat "docker run -d --name resume-backend -p 5000:5000 %BACKEND_IMAGE%:latest"
                bat "docker run -d --name resume-frontend -p 3000:80 %FRONTEND_IMAGE%:latest"
            }
        }
    }

    post {
        always {
            bat 'docker logout 2>nul || exit 0'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
