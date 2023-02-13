#!/usr/bin/env node
import 'source-map-support/register';
import {App, StackProps} from 'aws-cdk-lib';
import {HabiticaStack} from "../lib/habitica/habitica";

const props: StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
};

const app = new App();
new HabiticaStack(app, 'HabiticaStack', props);
