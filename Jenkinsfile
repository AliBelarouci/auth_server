pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                // Checkout your source code from the repository
                // Checkout your source code from the repository
                checkout([$class: 'GitSCM', 
                    branches: [[name: '*/main']], // or '*/master' depending on your default branch
                    userRemoteConfigs: [[url: 'https://<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>github.com/AliBelarouci/auth_service.git']]])
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
        
       
    }
}
