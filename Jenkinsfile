pipeline {
    agent any
    tools{
        nodejs 'node18'
    }
    stages {

      stage('Checkout') {
    steps {
        script {
            // Define the credential ID
            def credentialsId = 'PAT_jenkins' // Replace with the actual ID of your Jenkins credential
            
            // Checkout your source code from the repository using credentials
            checkout([$class: 'GitSCM', 
                branches: [[name: '*/main']], // or '*/master' depending on your default branch
                userRemoteConfigs: [[
                    url: 'https://github.com/AliBelarouci/auth_service.git',
                    credentialsId: credentialsId // Use the defined credentials ID
                ]]])
        }
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
