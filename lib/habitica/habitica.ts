import {Construct} from "constructs";
import {CfnParameter, Duration, Stack, StackProps} from "aws-cdk-lib";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {Vpc} from "aws-cdk-lib/aws-ec2";
import {ClickType, IotButton} from "../iot/iot-button";

export class HabiticaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiToken = new CfnParameter(this, 'apiToken', {
      type: 'String',
      description: 'API Token provided by Habitica',
    });

    const taskId = new CfnParameter(this, 'taskId', {
      type: 'String',
      description: 'ID of the Habitica task to score up',
    });

    const userId = new CfnParameter(this, 'userId', {
      type: 'String',
      description: 'UserID provided by Habitica',
    });

    const buttonSerial = new CfnParameter(this, 'buttonSerial', {
      type: 'String',
      description: 'Serial of the IoT Button to use',
      allowedPattern: /\w{16}/.source
    })
    const certificateArn = new CfnParameter(this, 'certificateArn', {
      type: 'String',
      description: 'ARN of the IoT Certificate to use',
    })

    const vpc = new Vpc(this, 'habitica-vpc');
    const scopeUpTask = new NodejsFunction(this, 'score-up', {
      vpc: vpc,
      allowAllOutbound: true,
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(5),
      environment: {
        'apiToken': apiToken.valueAsString,
        'userId': userId.valueAsString,
        'taskId': taskId.valueAsString,
      },
    });

    new IotButton(this, "IoTButton", {
      buttonSerial: buttonSerial.valueAsString,
      certificateArn: certificateArn.valueAsString,
      actions: {[ClickType.SINGLE]: scopeUpTask},
    });
  }
}
