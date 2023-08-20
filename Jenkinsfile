pipeline {
    agent any
    tools{
        nodejs 'node18'
    }
    environment {
        APP_NAME = "auth"
        RELEASE = "1.0.0"
        DOCKER_USER = "alisoufnet"
        DOCKER_PASS = 'docker'
        IMAGE_TAG = "${RELEASE}-${BUILD_NUMBER}"
        IMAGE_NAME = "${DOCKER_USER}/${APP_NAME}:${IMAGE_TAG}"
        //JENKINS_API_TOKEN = credentials("JENKINS_API_TOKEN")
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
                    url: 'https://github.com/AliBelarouci/auth_server.git',
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
        
           stage("Build & Push Docker Image") {
            steps {
                script {
                    sh 'docker --version'
                    docker.withRegistry('',DOCKER_PASS) {
                        docker_image = docker.build("${IMAGE_NAME}")
                    }

                    docker.withRegistry('',DOCKER_PASS) {
                        docker_image.push("${IMAGE_TAG}")
                        docker_image.push('latest')
                    }
                }
            }

        }
        
       
    }
}
