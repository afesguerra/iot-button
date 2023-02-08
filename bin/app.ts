#!/usr/bin/env node
import 'source-map-support/register';
import {App, StackProps} from 'aws-cdk-lib';
import {IoTButtonStack} from '../lib/iot-button-stack';
import {HabiticaStack} from "../lib/habitica/habitica";

const props: StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
};

const app = new App();
const {scopeUpTask} = new HabiticaStack(app, 'HabiticaStack', props);
new IoTButtonStack(app, 'IoTButtonStack', {
  ...props,
  singlePressFunction: scopeUpTask
});
