pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                // Checkout your source code from the repository
                // Checkout your source code from the repository
                checkout([$class: 'GitSCM', 
                    branches: [[name: '*/main']], // or '*/master' depending on your default branch
                    userRemoteConfigs: [[url: 'https://github.com/AliBelarouci/auth_service.git']]])
            }
        }
        
        stage('Install Dependencies') {
            steps {
                // Install Node.js dependencies
                sh 'npm install'
            }
        }
        
        stage('Run Tests') {
            steps {
                // Run tests for your NestJS application
                sh 'npm test'
            }
        }
        
        stage('Deploy') {
            steps {
                // Implement deployment steps here
            }
        }
    }
}
