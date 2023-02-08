import {Construct} from "constructs";
import {CfnParameter, Duration, Stack, StackProps} from "aws-cdk-lib";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {IFunction, Runtime} from "aws-cdk-lib/aws-lambda";
import {Vpc} from "aws-cdk-lib/aws-ec2";

export class HabiticaStack extends Stack {
  readonly scopeUpTask: IFunction;
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

    const vpc = new Vpc(this, 'habitica-vpc');
    this.scopeUpTask = new NodejsFunction(this, 'score-up', {
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
  }
}
