#!/usr/bin/env groovy

def mysh(cmd) {
    sh('#!/bin/sh -e\n' + cmd)
}

pipeline {

    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '5', daysToKeepStr: '7'))
        overrideIndexTriggers(true)
        timestamps()
    }

    environment {
        SERVICE_NAME = 'Hirest-Service'
        SRC_DIR = 'src'
        ARTIFACT_NAME = "${env.SERVICE_NAME}#${env.BRANCH_NAME}#${env.BUILD_NUMBER}#${env.DEPLOY_ENV}"
        NPM_REGISTRY = '10.0.2.7:4873'
    }

    tools {
        nodejs 'lts/carbon'
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: 'dev\ndev2\nqa\nstaging\nproduction', description: 'Select the deployment environment')
        choice(name: 'PRIORITY', choices:'3\n2\n1', description: 'Select job priority')
    }

    stages {

        stage('Inject Secrets') {

            when {
                environment name: 'DEPLOY_ENV' , value: 'production'
            }

            steps {
                    wrap([$class: 'AzureKeyVaultBuildWrapper',
                        azureKeyVaultSecrets: [
                            [secretType: 'Secret', name: 'smtp-auth-user-noreplysrkaycom', version: 'af45cb08641f473d954bc3de89ef30bc', envVariable: 'SMTP_USER'],
                            [secretType: 'Secret', name: 'smtp-auth-pass-noreplysrkaycom', version: 'c2d34fbed99e4a4c9571f99d11c7f312', envVariable: 'SMTP_PASS'],
                            [secretType: 'Secret', name: 'smtp-auth-user-careersrkwebin', version: '63459b03ead54270aa13d041185a676c', envVariable: 'SMTP_USER_CAREER_SRK'],
                            [secretType: 'Secret', name: 'smtp-auth-pass-careersrkwebin', version: 'd16f0e0f86284f7cb0af3a94131bb196', envVariable: 'SMTP_PASS_CAREER_SRK'],
                            [secretType: 'Secret', name: 'ldap-host', version: 'a97d0b3c25044178a3a4a54488db32bb', envVariable: 'LDAP_HOST'],
                            [secretType: 'Secret', name: 'graylog-host', version: '6f7f349fb3454f1cb6f7747fc29d10c3', envVariable: 'GRAYLOG_HOST']
                        ]
                    ])  {
                            mysh("sed -i s/{{smtp-auth-user}}/${env.SMTP_USER}/g ./src/config/production.json")
                            mysh("sed -i s/{{smtp-auth-pass}}/${env.SMTP_PASS}/g ./src/config/production.json")
                            mysh("sed -i s/{{smtp-auth-user-careersrkwebin}}/${env.SMTP_USER_CAREER_SRK}/g ./src/config/production.json")
                            mysh("sed -i s/{{smtp-auth-pass-careersrkwebin}}/${env.SMTP_PASS_CAREER_SRK}/g ./src/config/production.json")
                            mysh("sed -i s/{{ldap-host}}/${env.LDAP_HOST}/g ./src/config/production.json")
                            mysh("sed -i s/{{gray-log-host}}/${env.GRAYLOG_HOST}/g ./src/config/production.json")
                }
            }
        }

        stage('Build') {

            steps {
                print "Branch name: ${env.BRANCH_NAME}"
                sh "node -v"
                sh "npm -v"
                dir("${env.SRC_DIR}") {
                    sh "npm set registry http://${env.NPM_REGISTRY}"
                    sh 'npm-cache install npm'
                }
            }

        }

        stage('Package') {

            steps {
                dir("${env.SRC_DIR}") {
                    sh "tar -czf ${env.WORKSPACE}/${env.ARTIFACT_NAME}.tar.gz ."
                }
            }

        }

        stage("Set DEPLOY_ENV "){

             when {
                environment name: 'DEPLOY_ENV' , value: null
            }

            steps{
                script {
                    env.DEPLOY_ENV = 'dev'
                }
             }
        }

        stage('Post-build') {
            
            steps {
                archiveArtifacts artifacts: '*.tar.gz', fingerprint: true
                build job: 'Infra/downstream-upload',
                    parameters: [string(name: 'PROJECT_NAME', value: "${JOB_NAME}"), string(name: 'PROJECT_BUILD_NUMBER', value: "${BUILD_NUMBER}")]
            }
            
        }
    }

    post {

        always {
            cleanWs()
        }

        failure {
            mail to:"incoming+futurxlabs/steerhigh/steerhigh-service@gitlab.com",
                 subject:"Jenkins: FAILURE: ${currentBuild.fullDisplayName}",
                 body: "A jenkins job ${env.JOB_NAME} has been failed.\n\nPlease go to ${env.BUILD_URL} to check build failure reasons."
        }

    }

}
