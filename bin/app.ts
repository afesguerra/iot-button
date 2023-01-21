#!/usr/bin/env node
import 'source-map-support/register';
import {App} from 'aws-cdk-lib';
import {IoTButtonStack} from '../lib/iot-button-stack';

const app = new App();
new IoTButtonStack(app, 'IoTButtonStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
});
