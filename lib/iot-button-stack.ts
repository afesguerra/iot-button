import {Arn, ArnFormat, CfnParameter, Stack, StackProps} from 'aws-cdk-lib';
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

enum ClickType {
  SINGLE = 'single',
  DOUBLE = 'double',
  LONG = 'long',
}

interface IoTButtonProps extends StackProps{
  singlePressFunction?: IFunction;
  doublePressFunction?: IFunction;
  longPressFunction?: IFunction;
}
export class IoTButtonStack extends Stack {
  constructor(scope: Construct, id: string, props?: IoTButtonProps) {
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
    const topicArn = Arn.format({
      service: 'iot',
      resource: 'topic',
      resourceName: topic,
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    }, this);

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

    if (props?.singlePressFunction) {
      this.addRule(props.singlePressFunction, topic, buttonSerial.valueAsString, ClickType.SINGLE);
    }

    if (props?.doublePressFunction) {
      this.addRule(props.doublePressFunction, topic, buttonSerial.valueAsString, ClickType.DOUBLE);
    }

    if (props?.longPressFunction) {
      this.addRule(props.longPressFunction, topic, buttonSerial.valueAsString, ClickType.LONG);
    }
  }

  private addRule(lambdaFunction: IFunction, topic: string, buttonSerial: string, clickType: ClickType) {
    this.addDependency(Stack.of(lambdaFunction));

    new CfnTopicRule(this, `${clickType}-press-rule`, {
      ruleName: `${buttonSerial}_${clickType}_press`,
      topicRulePayload: {
        sql: `SELECT clickType FROM '${topic}' WHERE clickType = '${clickType.toUpperCase()}'`,
        actions: [
          {lambda: {functionArn: lambdaFunction.functionArn}},
        ]
      },
    });
  }
}
