import {CfnParameter, Stack, StackProps} from 'aws-cdk-lib';
import {CfnPolicy, CfnPolicyPrincipalAttachment, CfnThing, CfnThingPrincipalAttachment,} from 'aws-cdk-lib/aws-iot'
import {Construct} from 'constructs';
import {Effect, PolicyDocument, PolicyStatement} from "aws-cdk-lib/aws-iam";

export class IoTButtonStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const buttonSerial = new CfnParameter(this, 'buttonSerial', {
      type: 'String',
      description: 'Serial of the IoT Button to use',
      allowedPattern: /\w{16}/.source
    })
    const certificateArn = new CfnParameter(this, 'certificateArn', {
      type: 'String',
      description: 'ARN of the IoT Certificate to use',
    })

    const topic = `iotbutton/${buttonSerial.valueAsString}`;
    const topicArn = `arn:aws:iot:${props?.env?.region}:${props?.env?.account}:topic/${topic}`;

    const button = new CfnThing(this, 'IoTButton', {
      thingName: buttonSerial.valueAsString
    });

    const policyStatements: PolicyStatement[] = [{
      effect: Effect.ALLOW,
      actions: ['iot:Connect'],
      resources: ['*'],
    }, {
      effect: Effect.ALLOW,
      actions: ['iot:Publish'],
      resources: [topicArn],
    }].map(x => new PolicyStatement(x))

    const policy = new CfnPolicy(this, `publishPolicy`, {
      policyName: `iotbutton-${buttonSerial.valueAsString}-publish`,
      policyDocument: new PolicyDocument({
        statements: policyStatements
      })
    });

    const policyPrincipalAttachment = new CfnPolicyPrincipalAttachment(this, `linkPolicyToCertificate`, {
      policyName: policy.policyName as string,
      principal: certificateArn.valueAsString
    });
    policyPrincipalAttachment.addDependency(policy);

    const thingPrincipalAttachment = new CfnThingPrincipalAttachment(this, `linkIoTButtonToCertificate`, {
      thingName: button.thingName as string,
      principal: certificateArn.valueAsString
    });

    thingPrincipalAttachment.addDependency(button);
  }
}
