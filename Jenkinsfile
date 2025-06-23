pipeline {
  agent any

  environment {
    NODE_ENV = 'test'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm install'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint || true' // Optional: skip if not configured
      }
    }

    stage('Unit & Integration Tests') {
      steps {
        sh 'npx jest --ci --coverage'
      }
    }

    stage('E2E Tests') {
      steps {
        sh 'npx playwright install --with-deps'
        sh 'npx playwright test'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
  }

  post {
    always {
      junit '**/junit.xml'
      archiveArtifacts artifacts: '**/coverage/**', allowEmptyArchive: true
    }
    failure {
      mail to: 'dev-team@example.com', subject: 'Build Failed', body: 'Check Jenkins for details.'
    }
  }
}
