import {Arn, ArnFormat, Stack} from 'aws-cdk-lib';
import {
  CfnPolicy,
  CfnPolicyPrincipalAttachment,
  CfnThing,
  CfnThingPrincipalAttachment,
  CfnTopicRule
} from 'aws-cdk-lib/aws-iot'
import {Construct} from 'constructs';
import {Effect, PolicyDocument, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {IFunction} from "aws-cdk-lib/aws-lambda";

export enum ClickType {
  SINGLE = 'single',
  DOUBLE = 'double',
  LONG = 'long',
}

export interface IoTButtonProps {
  buttonSerial: string,
  certificateArn: string,
  actions: {[k in ClickType]?: IFunction}
}
export class IotButton extends Construct {
  constructor(scope: Construct, id: string, {
    actions, buttonSerial, certificateArn
  }: IoTButtonProps) {
    super(scope, id);

    const topic = `iotbutton/${buttonSerial}`;
    const topicArn = Arn.format({
      service: 'iot',
      resource: 'topic',
      resourceName: topic,
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    }, Stack.of(scope));

    const button = new CfnThing(this, 'IoTButton', {
      thingName: buttonSerial
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
      policyName: `iot-button-${buttonSerial}-publish`,
      policyDocument: new PolicyDocument({
        statements: policyStatements
      })
    });

    const policyPrincipalAttachment = new CfnPolicyPrincipalAttachment(this, `linkPolicyToCertificate`, {
      policyName: policy.policyName as string,
      principal: certificateArn
    });
    policyPrincipalAttachment.addDependency(policy);

    const thingPrincipalAttachment = new CfnThingPrincipalAttachment(this, `linkIoTButtonToCertificate`, {
      thingName: button.thingName as string,
      principal: certificateArn
    });
    thingPrincipalAttachment.addDependency(button);

    [ClickType.SINGLE, ClickType.DOUBLE, ClickType.LONG]
      .filter(x => actions[x])
      .forEach(clickType => {
        new CfnTopicRule(this, `${clickType}-press-rule`, {
          ruleName: `${buttonSerial}_${clickType}_press`,
          topicRulePayload: {
            sql: `SELECT clickType
                  FROM '${topic}'
                  WHERE clickType = '${clickType.toUpperCase()}'`,
            actions: [
              {lambda: {functionArn: actions[clickType]?.functionArn}},
            ]
          },
        });
      });
  }
}
